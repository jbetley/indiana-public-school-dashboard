#########################################
# ICSB Public School Academic Dashboard #
# Database Queries (SQLite)             #
#########################################
# author:   jbetley (https://github.com/jbetley)
# version:  0.9  # noqa: ERA001
# date:     01/06/25

# NOTE: No K8 academic data exists for 2020

# Current data:
# ILEARN & ILEARN Student - 2024
# IREAD & IREAD Student - 2024
# SAT - 2024
# ADM - 2024
# Attendance Rate - 2023
# Chronic Absenteeism - 2024
# Demographics - 2024 (except SPED/ELL)
# Financial - either 2023 (Audited) or 2024(Q4)
# Graduation Rate - 2023

import re

import numpy as np
import pandas as pd
from calculations import (
    calculate_percentage,  # TODO: Move this as well
)
from sqlalchemy import create_engine, text

engine = create_engine("sqlite:///data/indiana_schools_public.db")

print("Database Engine Created . . .")  # noqa: T201


def run_query(q, *args):
    """
    Takes sql text query, gets query as a dataframe (read_sql is a convenience function
    wrapper around read_sql_query), and perform a variety of basic clean up functions
    If no data matches the query, an empty df is returned

    Args:
        q (string): a sqlalchemy "text" query
        args (dict): a dict of query parameters
    Returns:
        pd.DataFrame: pandas dataframe of the query results
    """
    conditions = None

    with engine.connect() as conn:
        if args:
            conditions = args[0]

        df = pd.read_sql_query(q, conn, params=conditions)

        # sqlite column headers do not have spaces between words. But we need to
        # display the column names, so we have to do a bunch of str.replace to
        # account for all conditions. May be a better way, but this is pretty fast.
        # Adding a space between any lowercase character and any uppercase/number
        # character takes care of most of it. The other replace functions catch
        # edge cases.
        df.columns = df.columns.str.replace(r"([a-z])([A-Z1-9%])", r"\1 \2", regex=True)
        df.columns = df.columns.str.replace(
            r"([WADTO])([CATPB&])", r"\1 \2", regex=True,
        )
        df.columns = df.columns.str.replace(
            "EBRWand", "EBRW and",
        )  # better way to do this?
        df.columns = df.columns.str.replace(r"([A])([a])", r"\1 \2", regex=True)
        df.columns = df.columns.str.replace(r"([1-9])([(])", r"\1 \2", regex=True)
        df.columns = df.columns.str.replace("or ", " or ")
        df.columns = df.columns.astype(str)

        return df


def get_current_academic_year():
    """
    the most recent academic year of data according to the k8 ilearn
    data file

    Returns:
        int: an int representing the most recent year
    """
    db = engine.raw_connection()
    cur = db.cursor()
    cur.execute(""" SELECT MAX(Year) FROM academic_data_k8 """)
    year = cur.fetchone()[0]
    db.close()

    return year


current_academic_year = get_current_academic_year()


def get_current_demographic_year():
    """
    the most recent academic year of data according to the k8 ilearn
    data file

    Returns:
        int: an int representing the most recent year
    """
    db = engine.raw_connection()
    cur = db.cursor()
    cur.execute(""" SELECT MAX(Year) FROM demographic_data_corp """)
    year = cur.fetchone()[0]
    db.close()

    return year


current_demographic_year = get_current_demographic_year()


def get_excluded_years(year: str, category: str) -> list:
    """
    "excluded years" is a list of year strings (format YYYY) of all years
    that are more recent than the selected year. it is used to filter data

    Args:
        year (str): a year string in format YYYY

    Returns:
        list: a list of year strings - all years more recent than selected year
    """

    excluded_years = []

    if category == "demographic":
        test_year = current_demographic_year
    else:
        test_year = current_academic_year

    if int(year) == test_year:
        return []
    else:  # noqa: RET505
        count = int(test_year) - int(year)
        excluded_years = []

        for i in range(count):
            excluded_year = int(test_year) - i
            excluded_years.append(excluded_year)

    return excluded_years


def get_geo_corp(*args):
    keys = ["id", "type"]
    params = dict(zip(keys, args, strict=False))
    """
    Given School ID and Type returns the Corp ID of the school
    Corporation in which the school is located- distinct ensures
    only one value is returned (otherwise one will be returned
    for each year in the database)

    Args:
        school_id (string): a 4 digit number in string format
        type (string): "K8" or "HS"

    Returns:
        string: Corp ID
    """

    if params["type"] == "K8":
        q = text(
            """
            SELECT DISTINCT GEOCorp
                FROM academic_data_k8
                WHERE SchoolID = :id
            """,
        )

    else:
        q = text(
            """
            SELECT DISTINCT GEOCorp
                FROM academic_data_hs
                WHERE SchoolID = :id
            """,
        )

    result = run_query(q, params)

    return str(result["GEO Corp"][0])



def get_school_coordinates(*args):
    keys = ["year", "type"]
    params = dict(zip(keys, args, strict=False))

    if params["type"] == "HS":
        q = text(
            """
            SELECT Lat, Lon, SchoolID, SchoolName, HighGrade, LowGrade,
                TotalStudentCount
            FROM academic_data_hs
            WHERE Year = :year
        """,
        )
    else:
        q = text(
            """
            SELECT Lat, Lon, SchoolID, SchoolName, HighGrade, LowGrade,
                TotalStudentCount, "Total|ELATotalTested"
            FROM academic_data_k8
            WHERE Year = :year
        """,
        )

    return run_query(q, params)


def get_public_dropdown():
    params = {"id": ""}
    q = text(
        """
        SELECT *
            FROM demographic_data_school
        """,
    )

    results = run_query(q, params)

    grades = results[
        [
            "Grade 3",
            "Grade 4",
            "Grade 5",
            "Grade 6",
            "Grade 7",
            "Grade 8",
            "Grade 9",
            "Grade 10",
            "Grade 11",
            "Grade 12",
        ]
    ]
    grades = grades.replace(0, np.nan)
    grades = grades.replace("0", np.nan)

    low_high = pd.DataFrame()
    low_high["Low Grade"] = (
        grades.dropna(how="all").notna().idxmax(axis=1).astype("string")
    )
    low_high["High Grade"] = grades.apply(
        pd.Series.last_valid_index, axis=1,
    ).reset_index(drop=True)

    low_high["Low Grade"] = low_high["Low Grade"].str.replace("Grade ", "")
    low_high["High Grade"] = low_high["High Grade"].str.replace("Grade ", "")

    low_high["School Type"] = np.where(
        (low_high["Low Grade"].astype(int) < 9)
        & (low_high["High Grade"].astype(int) < 9),
        "K8",
        np.where(
            low_high["Low Grade"].astype(int) >= 9,
            "HS",
            np.where(
                (low_high["Low Grade"].astype(int) <= 3)
                & (low_high["High Grade"].astype(int) >= 9),
                "K12",
                "K8",
            ),
        ),
    )

    low_high["Sub Type"] = np.where(
        (low_high["Low Grade"].astype(int) < 5)
        & (low_high["High Grade"].astype(int) <= 5),
        "ES",
        np.where(
            (low_high["Low Grade"].astype(int) >= 5)
            & (low_high["High Grade"].astype(int) < 9),
            "MS",
            np.where(
                low_high["Low Grade"].astype(int) >= 9,
                "HS",
                np.where(
                    (low_high["Low Grade"].astype(int) <= 3)
                    & (low_high["High Grade"].astype(int) >= 9),
                    "K12",
                    "K8",
                ),
            ),
        ),
    )

    filtered = results[
        ["Year", "Corporation ID", "Corporation Name", "School ID", "School Name"]
    ]

    dropdown_list = pd.merge(
        filtered,
        low_high[["School Type", "Sub Type"]],
        left_index=True,
        right_index=True,
    )

    # cannot identify AHS by gradespan because their grade levels are
    # not reliably stored in the demographics file (usually as 11 & 12,
    # rarely "Adult")
    ahs_data = get_ahs_averages()

    ahs_data = ahs_data[["School ID", "School Type"]]
    ahs_data["Sub Type"] = ahs_data["School Type"]

    ahs_data = ahs_data.drop_duplicates(subset=["School ID"])

    ahs_data = ahs_data.set_index(["School ID"])
    dropdown_list = dropdown_list.set_index(["School ID"])

    dropdown_list.update(ahs_data)
    return dropdown_list.reset_index()



def get_academic_dropdown_years(*args):
    """
    gets a list of all (unqique) available years of academic proficiency data

    Args:
        school_id (string): a 4 digit number in string format
        school_type(string): K8, HS, AHS, or K12
    Returns:
        list: a list of integers representing years
    """
    keys = ["id", "type"]
    params = dict(zip(keys, args, strict=False))

    if params["type"] == "K8" or params["type"] == "K12":
        q = text(
            """
            SELECT DISTINCT	Year
            FROM academic_data_k8
            WHERE SchoolID = :id
        """,
        )
    else:
        q = text(
            """
            SELECT DISTINCT	Year
            FROM academic_data_hs
            WHERE SchoolID = :id
        """,
        )

    result = run_query(q, params)

    years = result["Year"].tolist()
    years.sort(reverse=True)

    return years


# Gets demographic data, attendance rate, and chronic absenteeism
# data for selected school and GEO Corp
def get_demographic_data(params):
    school_id = params["school_id"]
    school_type = params["school_type"]
    year = params["year"]

    geo_corp = get_geo_corp(school_id, school_type)

    # NOTE: For K12 schools, attendance data is the same in both
    # k8 and hs files - need to eventually fix this
    # TODO: currently treating K12 schools as K8 - need to fix once
    # TODO: have K8/HS Functionality

    if school_type == "K8" or school_type == "K12":
        table = "academic_data_k8"
    elif school_type == "HS":
        table = "academic_data_hs"

    # School demographic and attendance data
    w = text(
        """
        SELECT *
            FROM demographic_data_school
            WHERE SchoolID = :school_id
        """,
    )

    school_demographics = run_query(w, params)

    school_attendance_query_string = f"""
        SELECT Year, AttendanceRate, StudentsChronicallyAbsent, TotalStudentCount
            FROM {table}
            WHERE SchoolID = :school_id
        """  # noqa: S608

    y = text(school_attendance_query_string)

    school_attendance = run_query(y, params)

    school_attendance = school_attendance.sort_values(by="Year", ascending=False)

    school_attendance = school_attendance.replace(r"^\s*$", np.nan, regex=True)

    school_attendance["Chronic Absenteeism %"] = calculate_percentage(
        school_attendance["Students Chronically Absent"],
        school_attendance["Total Student Count"],
    )

    # Merge left on on demographics (will always have more data than attendance)
    school_merged = pd.merge(
        school_demographics, school_attendance, on="Year", how="left",
    )

    # Corp demographic and attendance data
    # NOTE: Do not believe that we are currently using this anywhere.
    corp_demographics_query_string = f"""
        SELECT *
            FROM demographic_data_corp
	        WHERE CorporationID = {geo_corp}
        """  # noqa: E101, S608

    x = text(corp_demographics_query_string)

    corp_demographics = run_query(x, params)

    # add missing columns
    corp_demographics[["School ID", "School Name"]] = corp_demographics[
        ["Corporation ID", "Corporation Name"]
    ]

    corp_attendance_query_string = f"""
        SELECT Year, AttendanceRate, StudentsChronicallyAbsent, TotalStudentCount
            FROM {table}
            WHERE CorporationID = {geo_corp}
        """  # noqa: S608

    z = text(corp_attendance_query_string)

    corp_attendance_raw = run_query(z, params)

    # Rough up an average by combining all schools from the corp
    # NOTE: This is approximate only - because K8 doesn't include
    # HS and vice versa.
    corp_attendance_raw = corp_attendance_raw.fillna("")

    for col in corp_attendance_raw.columns[1:]:
        corp_attendance_raw[col] = pd.to_numeric(
            corp_attendance_raw[col], errors="coerce",
        )

    corp_attendance = corp_attendance_raw.groupby("Year")[
        ["Students Chronically Absent", "Total Student Count"]
    ].sum()

    corp_attendance["Chronic Absenteeism %"] = (
        corp_attendance["Students Chronically Absent"]
        / corp_attendance["Total Student Count"]
    )

    corp_attendance["Attendance Rate"] = corp_attendance_raw.groupby("Year").agg(
        {"Attendance Rate": "mean"},
    )

    corp_merged = pd.merge(corp_demographics, corp_attendance, on="Year", how="left")

    # merge school and corp data
    all_demographics = pd.concat([school_merged, corp_merged], axis=0)

    all_demographics = all_demographics.drop(
        ["Students Chronically Absent", "Total Student Count"], axis=1,
    )

    excluded_years = get_excluded_years(year, "demographic")

    if excluded_years:
        all_demographics = all_demographics[
            ~all_demographics["Year"].isin(excluded_years)
        ]

    return all_demographics


def get_academic_data(*args):
    """Where the magic happens. Gets academic data for school, geo school corporation,
    and comparable schools, if relevant, and formats it for tables and figs depending
    on the requesting page.

    Args:
    schools (list): list of school IDs
    type (str): school type ("k8","k12","hs","ahs")
    year (str): selected year
    page (str): page from which data is requested

    Returns:
        data: pd.DataFrame
    """

    keys = ["schools", "type"]

    params = dict(zip(keys, args, strict=False))

    # if length of school_id is > 1, then we are pulling data for a list
    # of schools (academic_analysis), otherwise one school (academic_info and
    # academic_metric)
    if len(params["schools"]) > 1:
        school_str = ", ".join([str(int(v)) for v in params["schools"]])

    else:
        school_str = params["schools"][0]

    # Get data for academic_information and academic_metrics
    # all data / all years for school(s) and school corporation
    school_table = "academic_data_k8" if params["type"] == "K8" else "academic_data_hs"

    query_string = f"""
        SELECT *
            FROM {school_table}
            WHERE SchoolID IN ({school_str})"""  # noqa: S608

    q = text(query_string)

    return run_query(q, params)


def get_available_years(*args):
    """Returns a list of years where the selected school has at least some data
    for a particular tab. Drops all years where the school has no data at all for
    a particular category.

    Args:
    school_id (int): a school ID
    school_tab (str): the selected category tab (e.g., gradTab, ilearnTab)

    Returns:
        years: list
    """

    keys = ["school_id", "school_tab"]

    params = dict(zip(keys, args, strict=False))

    school_tab = params["school_tab"]
    school_id = params["school_id"]

    if school_tab == "satTab":
        q = text(
            """
            SELECT "Year", "SchoolTotal|EBRWTotalTested","PaidMeals|EBRWTotalTested",
                "FreeorReducedPriceMeals|EBRWTotalTested",
                "GeneralEducation|EBRWTotalTested", "SpecialEducation|EBRWTotalTested",
                "EnglishLanguageLearners|EBRWTotalTested",
                "NonEnglishLanguageLearners|EBRWTotalTested","Asian|EBRWTotalTested",
                "Black|EBRWTotalTested", "Hispanic|EBRWTotalTested",
                "Multiracial|EBRWTotalTested",
                "NativeHawaiianorOtherPacificIslander|EBRWTotalTested",
                "White|EBRWTotalTested",
                "SchoolTotal|MathTotalTested",
                "PaidMeals|MathTotalTested",
                "FreeorReducedPriceMeals|MathTotalTested",
                "GeneralEducation|MathTotalTested", "SpecialEducation|MathTotalTested",
                "EnglishLanguageLearners|MathTotalTested",
                "NonEnglishLanguageLearners|MathTotalTested","Asian|MathTotalTested",
                "Black|MathTotalTested", "Hispanic|MathTotalTested",
                "Multiracial|MathTotalTested",
                "NativeHawaiianorOtherPacificIslander|MathTotalTested",
                "White|MathTotalTested"
            FROM academic_data_hs
            WHERE SchoolID = :school_id""",
        )

    elif school_tab == "gradTab":
        q = text(
            """
            SELECT "Year","SchoolTotal|CohortCount", "PaidMeals|CohortCount",
                "FreeorReducedPriceMeals|CohortCount", "GeneralEducation|CohortCount",
                "SpecialEducation|CohortCount", "EnglishLanguageLearners|CohortCount",
                "NonEnglishLanguageLearners|CohortCount", "Asian|CohortCount",
                "Black|CohortCount", "Hispanic|CohortCount","Multiracial|CohortCount",
                "NativeHawaiianorOtherPacificIslander|CohortCount", "White|CohortCount"
            FROM academic_data_hs
            WHERE SchoolID = :school_id""",
            )

    elif school_tab == "ireadTab":
        q = text(
            """
            SELECT "Year","SchoolTotal|IREADTestN", "PaidMeals|IREADTestN",
                "FreeorReducedPriceMeals|IREADTestN", "GeneralEducation|IREADTestN",
                "SpecialEducation|IREADTestN", "EnglishLanguageLearners|IREADTestN",
                "NonEnglishLanguageLearners|IREADTestN", "AmericanIndian|IREADTestN",
                "Asian|IREADTestN", "Black|IREADTestN", "Hispanic|IREADTestN",
                "Multiracial|IREADTestN",
                "NativeHawaiianorOtherPacificIslander|IREADTestN", "White|IREADTestN"
            FROM academic_data_k8
            WHERE SchoolID = :school_id""",
        )
    else: # ilearnTab
        q = text(
            """
            SELECT "Year","PaidMeals|ELATotalTested",
                "FreeorReducedPriceMeals|ELATotalTested",
                "GeneralEducation|ELATotalTested", "SpecialEducation|ELATotalTested",
                "EnglishLanguageLearners|ELATotalTested",
                "NonEnglishLanguageLearners|ELATotalTested",
                "AmericanIndian|ELATotalTested", "Asian|ELATotalTested",
                "Black|ELATotalTested", "Hispanic|ELATotalTested",
                "Multiracial|ELATotalTested",
                "NativeHawaiianorOtherPacificIslander|ELATotalTested",
                "White|ELATotalTested","Grade3|ELATotalTested", "Grade4|ELATotalTested",
                "Grade5|ELATotalTested","Grade6|ELATotalTested","Grade7|ELATotalTested",
                "Grade8|ELATotalTested","SchoolTotal|ELATotalTested",
                "PaidMeals|MathTotalTested", "FreeorReducedPriceMeals|MathTotalTested",
                "GeneralEducation|MathTotalTested", "SpecialEducation|MathTotalTested",
                "EnglishLanguageLearners|MathTotalTested",
                "NonEnglishLanguageLearners|MathTotalTested",
                "AmericanIndian|MathTotalTested", "Asian|MathTotalTested",
                "Black|MathTotalTested", "Hispanic|MathTotalTested",
                "Multiracial|MathTotalTested",
                "NativeHawaiianorOtherPacificIslander|MathTotalTested",
                "White|MathTotalTested","Grade3|MathTotalTested",
                "Grade4|MathTotalTested","Grade5|MathTotalTested",
                "Grade6|MathTotalTested","Grade7|MathTotalTested",
                "Grade8|MathTotalTested","SchoolTotal|MathTotalTested"
            FROM academic_data_k8
            WHERE SchoolID = :school_id""",
        )

    result = run_query(q, params)

    pd.set_option('display.max_columns', None)
    pd.set_option('display.max_rows', None)

    for col in result.columns:
        result[col] = pd.to_numeric(result[col], errors="coerce")

    result.replace(0, np.nan, inplace=True)

    result = result.dropna(axis=1, how="all")

    results = (
        result.set_index("Year")
        .T.rename_axis("Category")
        .rename_axis(None, axis=1)
        .reset_index()
    )
    results = results.dropna(axis=1, how="all")

    years = results.columns.tolist()

    return [str(col) for col in years if "Category" not in str(col)]


def get_corporation_academic_data(*args: str) -> pd.DataFrame:
    """
    returns a dataframe of k8 academic data for a single school
    corporation

    Args:
        school_id (str): 4 digit school id in string format
        school_type (str): k8, hs, ahs, k12

    Returns:
        pd.DataFrame: ilearn proficiency data for corporation
    """
    keys = ["id", "type"]
    params = dict(zip(keys, args))

    # TODO: What if AHS?
    if params["type"] == "HS":  # or params["type"] == "AHS":
        table = "corporation_data_hs"
    else:
        table = "corporation_data_k8"

    q = text(
        """
        SELECT *
            FROM {}
            WHERE CorporationID = :id
        """.format(
            table
        )
    )

    # q = text(
    #     """
    #     SELECT *
    #         FROM {}
    #         WHERE CorporationID = (
    #             SELECT GEOCorp
    #                 FROM school_index
    #                 WHERE SchoolID = :id)""".format(
    #         table
    #     )
    # )

    results = run_query(q, params)

    results = results.sort_values(by="Year")

    return results


def get_graduation_data():
    params = dict(id="")

    q = text(
        """
        SELECT
            Year,
            SUM("Total|Graduates") / SUM("Total|CohortCount") AS "State Graduation Average"
        FROM academic_data_hs
        WHERE SchoolType != "AHS"
        GROUP BY
            Year
        """
    )

    results = run_query(q, params)

    results = results.loc[::-1].reset_index(drop=True)

    # merge state_grad_average with corp_data
    results = (
        results.set_index("Year")
        .T.rename_axis("Category")
        .rename_axis(None, axis=1)
        .reset_index()
    )

    # rename columns and add state_grad average to corp df
    results = results.rename(
        columns={c: str(c) + "Corp" for c in results.columns if c not in ["Category"]}
    )

    return results


def get_ahs_averages():
    """
    Gets data for all AHS for all years

    Args:

    Returns:
        pd.DataFrame: AHS Data
    """
    params = dict(id="")
    q = text(
        """
        SELECT *
            FROM academic_data_hs
            WHERE SchoolType = "AHS"
        """
    )

    results = run_query(q, params)

    return results


def get_adm_data(corp_id: str) -> pd.DataFrame:
    """
    gets a dataframe of detailed ADM data from IDOE's official ADM
    release (most accurate for previous years, but not very timely).

    Args:
        corp_id (string): a 4 digit number in string format

    Returns:
        pd.DataFrame: detailed adm data
    """
    params = dict(id=corp_id)

    q = text(
        """
        SELECT * 
        FROM adm_all
        WHERE CorporationID = :id
    """
    )

    results = run_query(q, params)

    return results


# TODO: Eventually merge into get_academic_data()
def get_year_over_year_data(*args):
    keys = ["school_id", "comp_list", "category", "year", "flag"]
    params = dict(zip(keys, args))

    school_str = ", ".join([str(int(v)) for v in params["comp_list"]])

    if params["flag"] == "sat":
        school_table = "academic_data_hs"
        corp_table = "corporation_data_hs"

        tested = params["category"] + " Total Tested"
        passed = params["category"] + " At Benchmark"
        result = params["category"] + " % At Benchmark"

        # if "School Total" - need to remove space
        if params["category"] == "Total|":
            tested = tested.replace("| ", "|")
            passed = passed.replace("| ", "|")
            result = result.replace("| ", "|")

    elif params["flag"] == "grad":
        school_table = "academic_data_hs"
        corp_table = "corporation_data_hs"

        tested = params["category"] + "Cohort Count"
        passed = params["category"] + "Graduates"
        result = params["category"] + "Graduation Rate"

        # if "Total" - need to remove space
        if params["category"] == "Total|":
            tested = tested.replace("| ", "|")
            passed = passed.replace("| ", "|")
            result = result.replace("| ", "|")

    else:  # k8 categories
        school_table = "academic_data_k8"
        corp_table = "corporation_data_k8"

        if "IREAD" in params["category"]:
            tested = params["category"] + " Test N"
            passed = params["category"] + " Pass N"
            result = params["category"] + " Passed"
        else:
            tested = params["category"] + " Total Tested"
            passed = params["category"] + " Total Proficient"
            result = params["category"] + " Proficient"

    # Query strings (param must be passed in with spaces)
    passed_query = passed.replace(" ", "")
    tested_query = tested.replace(" ", "")

    school_query_str = (
        "Year, SchoolID, SchoolName, LowGrade, HighGrade, SchoolType, "
        + '"'
        + passed_query
        + '", "'
        + tested_query
        + '"'
    )

    corp_query_str = (
        "Year, CorporationName, LowGrade, HighGrade, "
        + '"'
        + passed_query
        + '", "'
        + tested_query
        + '"'
    )

    # School Data
    query_string1 = """
        SELECT {}
            FROM {}
	        WHERE SchoolID = :school_id
        """.format(
        school_query_str, school_table
    )

    q1 = text(query_string1)

    school_data = run_query(q1, params)

    # get school type and then drop column (this just gets the string
    # value with the highest frequency - avoids situations where a
    # specific year may not have a value)
    school_type = school_data["School Type"].value_counts().index.values[0]

    school_data = school_data.drop(["School Type"], axis=1)

    # track school name, school id, and gradespan separately
    school_info = school_data[["School Name", "School ID", "Low Grade", "High Grade"]]

    school_name = school_data["School Name"][0]

    school_data[school_name] = pd.to_numeric(
        school_data[passed], errors="coerce"
    ) / pd.to_numeric(school_data[tested], errors="coerce")

    school_data = school_data.drop(
        ["School Name", "Low Grade", "High Grade", passed, tested], axis=1
    )
    school_data = school_data.sort_values("Year").reset_index(drop=True)

    # drop rows (years) where the school has no data
    # if dataframe is empty after, just return empty df
    school_data = school_data[school_data[school_name].notna()]

    if len(school_data.columns) == 0:
        result = school_data

    else:
        # Corp Data
        query_string2 = """
            SELECT {}
                FROM {}
                WHERE CorporationID = (
                    SELECT GEOCorp
                        FROM school_index
                        WHERE SchoolID = :school_id)
            """.format(
            corp_query_str, corp_table
        )

        q2 = text(query_string2)

        corp_data = run_query(q2, params)

        corp_data[corp_data["Corporation Name"][0]] = pd.to_numeric(
            corp_data[passed], errors="coerce"
        ) / pd.to_numeric(corp_data[tested], errors="coerce")
        corp_data = corp_data.drop(
            ["Corporation Name", "Low Grade", "High Grade", passed, tested], axis=1
        )
        corp_data = corp_data.sort_values("Year").reset_index(drop=True)

        # Comparison School Data
        query_string3 = """
                SELECT {}
                    FROM {}
                    WHERE SchoolID IN ({})""".format(
            school_query_str, school_table, school_str
        )

        q3 = text(query_string3)

        comparable_schools_data = run_query(q3, params)

        comparable_schools_data[result] = pd.to_numeric(
            comparable_schools_data[passed], errors="coerce"
        ) / pd.to_numeric(comparable_schools_data[tested], errors="coerce")

        # Store information about each school in separate df
        comparable_schools_info = comparable_schools_data[
            ["School Name", "School ID", "Low Grade", "High Grade"]
        ]

        # combine school and comp indexs into a list of School Names and School IDs
        all_school_info = pd.concat(
            [school_info, comparable_schools_info], ignore_index=True
        )

        all_school_info = all_school_info.drop_duplicates(subset=["School ID"])
        all_school_info = all_school_info.reset_index(drop=True)

        comparable_schools_data = comparable_schools_data.pivot(
            index="Year", columns="School Name", values=result
        )
        comparable_schools_data = comparable_schools_data.reset_index()
        comparable_schools_data = comparable_schools_data.sort_values("Year")

        if len(comparable_schools_data.columns) == 0:
            result = pd.merge(school_data, corp_data, on="Year")
        else:
            # do not merge school corp data with adult high school set
            if school_type == "AHS":
                result = pd.merge(school_data, comparable_schools_data, on="Year")
            else:
                result = pd.merge(
                    pd.merge(school_data, corp_data, on="Year"),
                    comparable_schools_data,
                    on="Year",
                )

        # account for changes in the year
        excluded_years = get_excluded_years(params["year"], "academic")
        if excluded_years:
            result = result[~result["Year"].isin(excluded_years)]

    return result, all_school_info
