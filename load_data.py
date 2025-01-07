#########################################
# ICSB Public School Academic Dashboard #
# Database Queries (SQLite)             #
#########################################
# author:   jbetley (https://github.com/jbetley)
# version:  0.9
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
# Financial - 2023 (Audited) / 2024(Q4)
# Graduation Rate - 2023

import pandas as pd
import numpy as np
import re
from sqlalchemy import create_engine, text

from calculations import (
    calculate_percentage,
    conditional_fillna,
    get_distance,
    calculate_proficiency,
    recalculate_total_proficiency,
    calculate_graduation_rate,
    calculate_sat_rate,
)

# from process_data import transpose_data

engine = create_engine("sqlite:///data/indiana_schools_public.db")

print("Database Engine Created . . .")


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

        # sqlite column headers do not have spaces between words. But we need to display the column names,
        # so we have to do a bunch of str.replace to account for all conditions. May be a better way, but
        # this is pretty fast. Adding a space between any lowercase character and any uppercase/number
        # character takes care of most of it. The other replace functions catch edge cases.
        df.columns = df.columns.str.replace(r"([a-z])([A-Z1-9%])", r"\1 \2", regex=True)
        df.columns = df.columns.str.replace(
            r"([WADTO])([CATPB&])", r"\1 \2", regex=True
        )
        df.columns = df.columns.str.replace(
            "EBRWand", "EBRW and"
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
    else:
        count = int(test_year) - int(year)
        excluded_years = []

        for i in range(count):
            excluded_year = int(test_year) - i
            excluded_years.append(excluded_year)

    return excluded_years


# def get_school_index(school_id):
#     """
#     returns school index information

#     Args:
#         school_id (string): a 4 digit number in string format

#     Returns:
#         pd.DataFrame: df of basic school information
#     """
#     params = dict(id=school_id)

#     q = text(
#         """
#         SELECT *
#             FROM school_index
#             WHERE school_index.SchoolID = :id
#         """
#     )

#     return run_query(q, params)


def get_geo_corp(*args):
    keys = ["id", "type"]
    params = dict(zip(keys, args))
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
            """
        )

    else:
        q = text(
            """
            SELECT DISTINCT GEOCorp
                FROM academic_data_hs
                WHERE SchoolID = :id
            """
        )

    result = run_query(q, params)

    result = str(result["GEO Corp"][0])

    return result


def get_ahs_averages():
    """
    Calculates State graduation average for all ahs for
    all years (as a substitute for state or corp avg)

    Args:

    Returns:
        pd.DataFrame: ahs grad averages
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


# def get_excluded_years(year: str) -> list:
#     """
#     "excluded years" is a list of year strings (format YYYY) of all years
#     that are more recent than the selected year. it is used to filter data

#     Args:
#         year (str): a year string in format YYYY

#     Returns:
#         list: a list of year strings - all years more recent than selected year
#     """
#     excluded_years = []

#     excluded_academic_years = int(current_academic_year) - int(year)

#     for i in range(excluded_academic_years):
#         excluded_year = int(current_academic_year) - i
#         excluded_years.append(excluded_year)

#     return excluded_years


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

    if params["type"] == "hs" or params["type"] == "ahs":
        table = "corporation_data_hs"
    else:
        table = "corporation_data_k8"

    q = text(
        """
        SELECT *
            FROM {}
            WHERE CorporationID = (
                SELECT GEOCorp
                    FROM school_index
                    WHERE SchoolID = :id)""".format(
            table
        )
    )

    results = run_query(q, params)

    results = results.sort_values(by="Year")

    return results


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
    params = dict(zip(keys, args))

    if params["type"] == "K8" or params["type"] == "K12":
        q = text(
            """
            SELECT DISTINCT	Year
            FROM academic_data_k8
            WHERE SchoolID = :id
        """
        )
    else:
        q = text(
            """
            SELECT DISTINCT	Year
            FROM academic_data_hs
            WHERE SchoolID = :id
        """
        )

    result = run_query(q, params)

    years = result["Year"].tolist()
    years.sort(reverse=True)

    return years


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


# def get_adm(corp_id):
#     # financial data will almost always be more accurate, but
#     # some schools (Guests) don't have financial data and this
#     # is an adequate substitute.

#     params = dict(id=corp_id)

#     q = text(
#         """
#         SELECT *
#         FROM adm_all
#         WHERE CorporationID = :id
#     """
#     )

#     results = run_query(q, params)

#     # NOTE: From 2016 - 2019  "SpringADM" & "FallADM"; beginning with
#     # 2019-20SY: "2019Fall Non Virtual ADM" & "2020Spring Non Virtual ADM"

#     # drop "Virtual ADM"
#     results = results.drop(
#         list(
#             results.filter(
#                 regex="Fall Virtual ADM|Spring Virtual ADM|Corporation ID|Name"
#             )
#         ),
#         axis=1,
#     )

#     # Each adm average requires 2 columns (Fall and Spring). If there are an
#     # odd number of columns after the above drop, that means that the last
#     # column is a Fall without a Spring, so we store that column, drop it,
#     # and add it back later
#     if (len(results.columns) % 2) != 0:
#         last_col = pd.DataFrame()
#         last_col_name = str(int(results.columns[-1][:4]) + 1)
#         last_col[last_col_name] = results[results.columns[-1]]
#         results = results.drop(results.columns[-1], axis=1)

#     adm_columns = [c[:4] for c in results.columns if "Spring" in c]

#     # make numbers
#     for col in results:
#         results[col] = pd.to_numeric(results[col], errors="coerce")

#     # Average each group of 2 columns and use name of 2nd column (Spring) for result
#     final = results.groupby(np.arange(len(results.columns)) // 2, axis=1).mean()
#     final.columns = adm_columns

#     if not last_col.empty:
#         final[last_col_name] = last_col[last_col_name]

#     return final


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


def get_gradespan(school_id, selected_year, all_years):
    # returns a list of grades for for which a school has numbers for both Tested
    # and Proficient students for the selected year (and all earlier years)
    # if no grades are found - returns an empty list
    params = dict(id=school_id)

    idx = all_years.index(int(selected_year))
    available_years = all_years[idx:]

    year_str = ", ".join([str(int(v)) for v in available_years])

    q = text(
        """
        SELECT "Grade3|ELATotalTested", "Grade4|ELATotalTested", "Grade5|ELATotalTested", "Grade6|ELATotalTested", "Grade7|ELATotalTested","Grade8|ELATotalTested",
            "Grade3|ELATotalProficient", "Grade4|ELATotalProficient", "Grade5|ELATotalProficient", "Grade6|ELATotalProficient", "Grade7|ELATotalProficient","Grade8|ELATotalProficient"
            FROM academic_data_k8
            WHERE SchoolID = :id AND Year IN ({})""".format(
            year_str
        )
    )

    result = run_query(q, params)

    # change "***" to nan
    for col in result.columns:
        result[col] = pd.to_numeric(result[col], errors="coerce")

    # change 0 to nan
    result.replace(0, np.nan, inplace=True)

    # drop those nas
    result = result.dropna(axis=1, how="all")

    # get a list of remaining grades (will be duplicates where both Tested and Proficient are
    # not nan or 0)
    regex = re.compile(r"\b\d\b")
    test_cols = [regex.search(i).group() for i in result.columns.tolist()]

    # remove unique items (where Tested and Proficient are not both numbers)
    dupe_cols = [i for i in test_cols if test_cols.count(i) > 1]

    # keep one of each item
    result = list(set(dupe_cols))

    result.sort()

    return result


def get_ethnicity(
    school_id, school_type, hs_category, subject_value, selected_year, all_years
):
    # returns a list of ethnicities for which a school has numbers for both Tested
    # and Proficient students for the selected year (and all earlier years)

    params = dict(id=school_id)

    idx = all_years.index(int(selected_year))
    available_years = all_years[idx:]

    year_str = ", ".join([str(int(v)) for v in available_years])

    if school_type == "hs":
        if hs_category == "SAT":
            q = text(
                """
                SELECT "AmericanIndian|EBRWTotalTested", "Asian|EBRWTotalTested", "Black|EBRWTotalTested", "Hispanic|EBRWTotalTested", "Multiracial|EBRWTotalTested","NativeHawaiianorOtherPacificIslander|EBRWTotalTested", "White|EBRWTotalTested",
                    "AmericanIndian|EBRWAtBenchmark", "Asian|EBRWAtBenchmark", "Black|EBRWAtBenchmark", "Hispanic|EBRWAtBenchmark", "Multiracial|EBRWAtBenchmark","NativeHawaiianorOtherPacificIslander|EBRWAtBenchmark", "White|EBRWAtBenchmark"
                    FROM academic_data_hs
                    WHERE SchoolID = :id AND Year IN ({})""".format(
                    year_str
                )
            )

        else:
            q = text(
                """
                SELECT "AmericanIndian|CohortCount", "Asian|CohortCount", "Black|CohortCount", "Hispanic|CohortCount", "Multiracial|CohortCount","NativeHawaiianorOtherPacificIslander|CohortCount", "White|CohortCount",
                    "AmericanIndian|Graduates", "Asian|Graduates", "Black|Graduates", "Hispanic|Graduates", "Multiracial|Graduates","NativeHawaiianorOtherPacificIslander|Graduates", "White|Graduates"
                    FROM academic_data_hs
                    WHERE SchoolID = :id AND Year IN ({})""".format(
                    year_str
                )
            )

    else:
        # k8
        if subject_value == "IREAD":
            q = text(
                """
                SELECT "AmericanIndian|IREADTestN", "Asian|IREADTestN", "Black|IREADTestN", "Hispanic|IREADTestN", "Multiracial|IREADTestN","NativeHawaiianorOtherPacificIslander|IREADTestN", "White|IREADTestN",
                    "AmericanIndian|IREADPassN", "Asian|IREADPassN", "Black|IREADPassN", "Hispanic|IREADPassN", "Multiracial|IREADPassN","NativeHawaiianorOtherPacificIslander|IREADPassN", "White|IREADPassN"
                    FROM academic_data_k8
                    WHERE SchoolID = :id AND Year IN ({})""".format(
                    year_str
                )
            )
        else:
            q = text(
                """
                SELECT "AmericanIndian|ELATotalTested", "Asian|ELATotalTested", "Black|ELATotalTested", "Hispanic|ELATotalTested", "Multiracial|ELATotalTested","NativeHawaiianorOtherPacificIslander|ELATotalTested", "White|ELATotalTested",
                    "AmericanIndian|ELATotalProficient", "Asian|ELATotalProficient", "Black|ELATotalProficient", "Hispanic|ELATotalProficient", "Multiracial|ELATotalProficient","NativeHawaiianorOtherPacificIslander|ELATotalProficient", "White|ELATotalProficient"
                    FROM academic_data_k8
                    WHERE SchoolID = :id AND Year IN ({})""".format(
                    year_str
                )
            )

    result = run_query(q, params)

    for col in result.columns:
        result[col] = pd.to_numeric(result[col], errors="coerce")

    result.replace(0, np.nan, inplace=True)

    result = result.dropna(axis=1, how="all")

    test_cols = [item.split("|")[0] for item in result.columns.values]

    dupe_cols = [i for i in test_cols if test_cols.count(i) > 1]

    result = list(set(dupe_cols))

    return result


def get_subgroup(
    school_id, school_type, hs_category, subject_value, selected_year, all_years
):
    # returns a list of subgroups for which a school has numbers for both Tested
    # and Proficient students for the selected year (and all earlier years)

    params = dict(id=school_id)

    idx = all_years.index(int(selected_year))
    available_years = all_years[idx:]

    year_str = ", ".join([str(int(v)) for v in available_years])

    if school_type == "hs":
        if hs_category == "SAT":
            q = text(
                """
                SELECT "PaidMeals|EBRWTotalTested", "FreeorReducedPriceMeals|EBRWTotalTested", "GeneralEducation|EBRWTotalTested", "SpecialEducation|EBRWTotalTested", "EnglishLanguageLearners|EBRWTotalTested","NonEnglishLanguageLearners|EBRWTotalTested",
                "PaidMeals|EBRWAtBenchmark", "FreeorReducedPriceMeals|EBRWAtBenchmark", "GeneralEducation|EBRWAtBenchmark", "SpecialEducation|EBRWAtBenchmark", "EnglishLanguageLearners|EBRWAtBenchmark","NonEnglishLanguageLearners|EBRWAtBenchmark"
                FROM academic_data_hs
                WHERE SchoolID = :id AND Year IN ({})""".format(
                    year_str
                )
            )

        else:
            q = text(
                """
                SELECT "PaidMeals|CohortCount", "FreeorReducedPriceMeals|CohortCount", "GeneralEducation|CohortCount", "SpecialEducation|CohortCount", "EnglishLanguageLearners|CohortCount","NonEnglishLanguageLearners|CohortCount",
                "PaidMeals|Graduates", "FreeorReducedPriceMeals|Graduates", "GeneralEducation|Graduates", "SpecialEducation|Graduates", "EnglishLanguageLearners|Graduates","NonEnglishLanguageLearners|Graduates"
                FROM academic_data_hs
                WHERE SchoolID = :id AND Year IN ({})""".format(
                    year_str
                )
            )

    else:  # k8
        if subject_value == "IREAD":
            q = text(
                """
                SELECT "PaidMeals|IREADTestN", "FreeorReducedPriceMeals|IREADTestN", "GeneralEducation|IREADTestN", "SpecialEducation|IREADTestN", "EnglishLanguageLearners|IREADTestN","NonEnglishLanguageLearners|IREADTestN",
                    "PaidMeals|IREADPassN", "FreeorReducedPriceMeals|IREADPassN", "GeneralEducation|IREADPassN", "SpecialEducation|IREADPassN", "EnglishLanguageLearners|IREADPassN","NonEnglishLanguageLearners|IREADPassN"
                    FROM academic_data_k8
                    WHERE SchoolID = :id AND Year IN ({})""".format(
                    year_str
                )
            )

        else:
            q = text(
                """
                SELECT "PaidMeals|ELATotalTested", "FreeorReducedPriceMeals|ELATotalTested", "GeneralEducation|ELATotalTested", "SpecialEducation|ELATotalTested", "EnglishLanguageLearners|ELATotalTested","NonEnglishLanguageLearners|ELATotalTested",
                    "PaidMeals|ELATotalProficient", "FreeorReducedPriceMeals|ELATotalProficient", "GeneralEducation|ELATotalProficient", "SpecialEducation|ELATotalProficient", "EnglishLanguageLearners|ELATotalProficient","NonEnglishLanguageLearners|ELATotalProficient"
                    FROM academic_data_k8
                    WHERE SchoolID = :id AND Year IN ({})""".format(
                    year_str
                )
            )

    result = run_query(q, params)

    for col in result.columns:
        result[col] = pd.to_numeric(result[col], errors="coerce")

    result.replace(0, np.nan, inplace=True)

    result = result.dropna(axis=1, how="all")

    test_cols = [item.split("|")[0] for item in result.columns.values]

    dupe_cols = [i for i in test_cols if test_cols.count(i) > 1]

    result = list(set(dupe_cols))

    return result


# Calculates AHS State Graduation Average for all Years as
# a substitute for corp_data
def get_public_dropdown():
    params = dict(id="")
    q = text(
        """
        SELECT *
            FROM demographic_data_school
        """
    )

    results = run_query(q, params)

    # TODO: THis next bit should probably be a function - it takes demographic
    # TODO: data and calculates Low and High grade and then uses those values
    # TODO: to return a school Type
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
        pd.Series.last_valid_index, axis=1
    ).reset_index(drop=True)

    low_high["Low Grade"] = low_high["Low Grade"].str.replace("Grade ", "")
    low_high["High Grade"] = low_high["High Grade"].str.replace("Grade ", "")

    low_high["Type"] = np.where(
        (low_high["Low Grade"].astype(int) < 9)
        & (low_high["Low Grade"].astype(int) < 9),
        "K8",
        np.where(
            low_high["Low Grade"].astype(int) >= 9,
            "HS",
            np.where(
                (low_high["Low Grade"].astype(int) < 9)
                & (low_high["Low Grade"].astype(int)),
                "K8",
                "K8",
            ),
        ),
    )  # TODO: Change last K8 to K12 when have K8/HS functionality

    filtered = results[
        ["Year", "Corporation ID", "Corporation Name", "School ID", "School Name"]
    ]

    dropdown_list = pd.merge(
        filtered, low_high["Type"], left_index=True, right_index=True
    )

    return dropdown_list


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
        """
    )

    school_demographics = run_query(w, params)

    school_attendance_query_string = """
        SELECT Year, AttendanceRate, StudentsChronicallyAbsent, TotalStudentCount
            FROM {}
	        WHERE SchoolID = :school_id
        """.format(
        table
    )

    y = text(school_attendance_query_string)

    school_attendance = run_query(y, params)

    school_attendance = school_attendance.sort_values(by="Year", ascending=False)

    # school_attendance = school_attendance[
    #     school_attendance["Attendance Rate"].notnull()
    # ]

    school_attendance = school_attendance.replace(r"^\s*$", np.nan, regex=True)

    school_attendance["Chronic Absenteeism %"] = calculate_percentage(
        school_attendance["Students Chronically Absent"],
        school_attendance["Total Student Count"],
    )

    # Merge left on on demographics (will always have more data than attendance)
    school_merged = pd.merge(
        school_demographics, school_attendance, on="Year", how="left"
    )

    # Corp demographic and attendance data
    # NOTE: Do not believe that we are currently using this anywhere.
    corp_demographics_query_string = """
        SELECT *
            FROM demographic_data_corp
	        WHERE CorporationID = {}
        """.format(
        geo_corp
    )

    x = text(corp_demographics_query_string)

    corp_demographics = run_query(x, params)

    # add missing columns
    corp_demographics[["School ID", "School Name"]] = corp_demographics[
        ["Corporation ID", "Corporation Name"]
    ]

    corp_attendance_query_string = """
            SELECT Year, AttendanceRate, StudentsChronicallyAbsent, TotalStudentCount
                FROM {}
                WHERE CorporationID = {}
            """.format(
        table, geo_corp
    )

    z = text(corp_attendance_query_string)

    corp_attendance_raw = run_query(z, params)

    # Rough up an average by combining all schools from the corp
    # NOTE: This is approximate only - because K8 doesn't include
    # HS and vice versa.
    corp_attendance_raw = corp_attendance_raw.fillna("")

    for col in corp_attendance_raw.columns[1:]:
        corp_attendance_raw[col] = pd.to_numeric(
            corp_attendance_raw[col], errors="coerce"
        )

    corp_attendance = corp_attendance_raw.groupby("Year")[
        ["Students Chronically Absent", "Total Student Count"]
    ].sum()

    corp_attendance["Chronic Absenteeism %"] = (
        corp_attendance["Students Chronically Absent"]
        / corp_attendance["Total Student Count"]
    )

    corp_attendance["Attendance Rate"] = corp_attendance_raw.groupby("Year").agg(
        {"Attendance Rate": "mean"}
    )

    corp_merged = pd.merge(corp_demographics, corp_attendance, on="Year", how="left")

    # merge school and corp data
    all_demographics = pd.concat([school_merged, corp_merged], axis=0)

    all_demographics = all_demographics.drop(
        ["Students Chronically Absent", "Total Student Count"], axis=1
    )

    excluded_years = get_excluded_years(year, "demographic")

    if excluded_years:
        all_demographics = all_demographics[
            ~all_demographics["Year"].isin(excluded_years)
        ]

    return all_demographics


def get_school_coordinates(*args):
    keys = ["year", "type"]
    params = dict(zip(keys, args))

    if params["type"] == "HS":
        q = text(
            """
            SELECT Lat, Lon, SchoolID, SchoolName, HighGrade, LowGrade
                FROM academic_data_hs
                WHERE Year = :year
        """
        )
    else:
        q = text(
            """
            SELECT Lat, Lon, SchoolID, SchoolName, HighGrade, LowGrade, "Total|ELATotalTested"
                FROM academic_data_k8
                WHERE Year = :year
        """
        )

    return run_query(q, params)


def get_academic_data_basic(*args):
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

    params = dict(zip(keys, args))

    # if length of school_id is > 1, then we are pulling data for a list
    # of schools (academic_analysis), otherwise one school (academic_info and
    # academic_metric)
    if len(params["schools"]) > 1:
        school_str = ", ".join([str(int(v)) for v in params["schools"]])

    else:
        school_str = params["schools"][0]

    # Get data for academic_information and academic_metrics
    # all data / all years for school(s) and school corporation
    if params["type"] == "K8":
        school_table = "academic_data_k8"
    else:
        school_table = "academic_data_hs"

    query_string = """
        SELECT *
            FROM {}
            WHERE SchoolID IN ({})""".format(
        school_table, school_str
    )

    q = text(query_string)

    results = run_query(q, params)

    return results


def get_corporation_academic_data(*args):
    keys = ["id", "type"]
    params = dict(zip(keys, args))

    if params["type"] == "HS":
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

    results = run_query(q, params)

    results = results.sort_values(by="Year")

    return results


# Where all the magic happens
# Gets all the academic data and formats it for display
def get_academic_data(*args):
    """Where the magic happens. Gets academic data for school, geo school corporation,
    and comparable schools, if relevant, and formats it for tables and figs depending
    on the requesting page.

    Args:
    schools (list): list of school IDs
    type (str): school type ("K8","K12","HS")
    year (str): selected year
    comparison_schools (list): school ids of comparison schools

    Returns:
        data: pd.DataFrame
    """
    keys = ["school_id", "type", "year", "comparison_schools"]

    params = dict(zip(keys, args))

    # if params["comparison_schools"] is a list, we are getting data for comparable
    # schools (academic analysis). if not, we are getting data for one school
    # (academic info)
    is_list = False

    if params["comparison_schools"]:  # isinstance(params["school_id"], list):
        is_list = True

    if is_list == True:
        school_id = str(params["comparison_schools"][0])
        school_str = ", ".join([str(int(v)) for v in params["comparison_schools"]])
        # school_id = str(params["school_id"][0])
        # school_str = ", ".join([str(int(v)) for v in params["school_id"]])
    else:
        school_id = str(params["school_id"])
        school_str = params["school_id"]

    # Get data for academic_information and academic_metrics
    # all data / all years for school(s) and school corporation
    if params["type"] == "K8":
        school_table = "academic_data_k8"
    else:
        school_table = "academic_data_hs"

    query_string = """
        SELECT *
            FROM {}
            WHERE SchoolID IN ({})""".format(
        school_table, school_str
    )

    q = text(query_string)

    school_data = run_query(q, params)

    # do not add corp data to single school (academic info)
    if is_list == True:
        # get corp data and add to dataframe (selected school will always
        # be at index[0] due to distance sort)
        corp_id = str(school_data["Corporation ID"][0])

        corp_data = get_corporation_academic_data(corp_id, params["type"])

        # add columns not in corp database
        corp_data["School ID"] = corp_data["Corporation ID"]
        corp_data["School Name"] = corp_data["Corporation Name"]

        # merge - result includes school, school corp, and comparable schools if
        # multiple school ids in the schools variable
        school_data = pd.concat([school_data, corp_data], axis=0)

    # Drop years of data that have been excluded by the
    # selected year (are later than)
    excluded_years = get_excluded_years(params["year"], "academic")

    if excluded_years:
        school_data = school_data[~school_data["Year"].isin(excluded_years)]

    school_data = school_data.sort_values(by="Year", ascending=False)

    school_data = school_data.reset_index(drop=True)

    # Drop all columns for a Category if the value of "Total Tested" for
    # the Category for the school is null or 0 for the "school"
    drop_columns = []

    data = school_data.copy()

    # convert from float to str while dropping the decimal
    data["School ID"] = data["School ID"].astype("Int64").astype("str")
    data["Corporation ID"] = data["Corporation ID"].astype("Int64").astype("str")

    if params["type"] == "K8":
        tested_cols = [
            col
            for col in data.columns.to_list()
            if "Total Tested" in col or "Test N" in col
        ]
    else:
        tested_cols = [
            col
            for col in data.columns.to_list()
            if "Total Tested" in col or "Cohort Count" in col
        ]

    for col in tested_cols:
        if (
            pd.to_numeric(
                data[data["School ID"] == school_id][col], errors="coerce"
            ).sum()
            == 0
            or data[data["School ID"] == school_id][col].isnull().all()
        ):
            if "Total Tested" in col:
                match_string = " Total Tested"
            else:
                if params["type"] == "K8":
                    match_string = " Test N"
                else:
                    match_string = "|Cohort Count"

            matching_cols = data.columns[
                pd.Series(data.columns).str.startswith(col.split(match_string)[0])
            ]

            drop_columns.append(matching_cols.tolist())

    drop_all = [i for sub_list in drop_columns for i in sub_list]

    data = data.drop(drop_all, axis=1).copy()

    # k8 or hs data with excluded years and non-tested categories dropped
    data = data.reset_index(drop=True)

    # process HS data
    if params["type"] == "HS":
        processed_data = data.copy()

        # remove "EBRW and Math" columns
        processed_data = processed_data.drop(
            list(processed_data.filter(regex="EBRW and Math")), axis=1
        )

        # Calculate Grad Rate
        if "Total|Cohort Count" in processed_data.columns:
            processed_data = calculate_graduation_rate(processed_data)

        # Calculate SAT Rates #
        if "Total|EBRW Total Tested" in processed_data.columns:
            processed_data = calculate_sat_rate(processed_data)

    # process K8 data
    elif params["type"] == "K8":
        processed_data = data.copy()

        # remove "ELA and Math" columns
        processed_data = processed_data.drop(
            list(processed_data.filter(regex="ELA and Math")), axis=1
        )

        processed_data = calculate_proficiency(processed_data)

        # In order for an apples to apples comparison between School Total Proficiency,
        # we need to recalculate it for the comparison schools using the same grade span
        # as the selected school. E.g., school is k-5, comparison school is k-8, we
        # recalculate comparison school totals using only grade k-5 data.
        comparison_data = processed_data.loc[
            processed_data["School ID"] != school_id
        ].copy()

        school_data = processed_data.loc[
            processed_data["School ID"] == school_id
        ].copy()

        # TODO: Testing - Change school ID to 0 for school corporation to prevent
        # TODO: School corp and School ID overlap - REAL ISSUE - WHY IS THE
        # TODO: OLD SCHOOL CORPORATION STAYING?
        comparison_data.loc[comparison_data["GEO Corp"].isna(), "School ID"] = "0"

        revised_totals = recalculate_total_proficiency(comparison_data, school_data)

        processed_data = processed_data.set_index(["School ID", "Year"])
        processed_data.update(revised_totals.set_index(["School ID", "Year"]))

        # this is school, school corporation, and comparable school data
        processed_data = processed_data.reset_index()

    # if all columns in data other than the 1st (Year) are null
    # then return empty df
    if processed_data.iloc[:, 1:].isna().all().all():
        return pd.DataFrame()

    else:
        if params["type"] == "HS":
            hs_data = processed_data.copy()

            analysis_data = hs_data.filter(
                regex=r"School ID|School Name|Low Grade|High Grade|Corporation ID|Corporation Name|Graduation Rate$|Benchmark \%|^Year$",
                axis=1,
            ).copy()

            analysis_data = analysis_data.drop(
                list(analysis_data.filter(regex="EBRW and Math")), axis=1
            )

            hs_cols = [
                c
                for c in analysis_data.columns
                if c not in ["School Name", "Corporation Name"]
            ]

            # get index of rows where school_id matches selected school
            school_idx = analysis_data.index[
                analysis_data["School ID"] == school_id
            ].tolist()[0]

            # force all to numeric (this removes "***" strings) - we
            # later use NaN as a proxy
            for col in hs_cols:
                analysis_data[col] = pd.to_numeric(analysis_data[col], errors="coerce")

            # drop all columns where the row at school_name_idx has a NaN value
            analysis_data = analysis_data.loc[:, ~hs_data.iloc[school_idx].isna()]

            return analysis_data

        else:
            analysis_data = processed_data.copy()

            # TODO: Testing removing this - need all rows for stacked bars
            # analysis_data = k8_data.filter(
            #     regex=r"\|ELA Proficient %$|\|Math Proficient %$|IREAD Proficient %|^Year$|Low|High|School Name|School ID|Corporation ID",
            #     axis=1,
            # )
            analysis_data = analysis_data.sort_values("Year").reset_index(drop=True)

            analysis_data = analysis_data[
                analysis_data.columns[
                    ~analysis_data.columns.str.contains(r"Female|Male")
                ]
            ]

            # We don't want to get rid of "***" yet, but we also don't
            # want to pass through a dataframe that that is all "***" - so
            # we convert create a copy, coerce all of the academic columns
            # to numeric and check to see if the entire dataframe for NaN
            check_for_unchartable_data = analysis_data.copy()

            check_for_unchartable_data.drop(
                ["School Name", "School ID", "Low Grade", "High Grade", "Year"],
                axis=1,
                inplace=True,
            )

            for col in check_for_unchartable_data.columns:
                check_for_unchartable_data[col] = pd.to_numeric(
                    check_for_unchartable_data[col], errors="coerce"
                )

            # one last check
            if (
                (params["type"] == "K8" or params["type"] == "K12")
                and len(analysis_data.index) > 0
            ) and check_for_unchartable_data.isnull().all().all() == True:

                analysis_data = pd.DataFrame()

                return analysis_data

            else:
                # add distance to dataframe - got too complicated to figure
                # out how to get the distance data from get school coordinates
                # through index.html and then back here to add, so instead, we
                # just rerun the distance analysis on the analysis data (which
                # should be only a couple dozen rows)

                # for distance calculation purposes just use one year of data
                # max_year = str(analysis_data["Year"].max())
                # distance_data = analysis_data[
                #     analysis_data["Year"].astype(str) == max_year
                # ].copy()

                # distance_data = distance_data.reset_index(drop=True)

                # school_idx = distance_data[
                #     distance_data["School ID"] == school_id
                # ].index

                # distances = get_distance(school_idx, distance_data)

                # TODO: merge distances with analysis data

                return analysis_data


# TODO: Do we need a default on error?
# return data


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