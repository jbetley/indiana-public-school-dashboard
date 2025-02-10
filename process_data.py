#########################################
# ICSB Public School Academic Dashboard #
# data cleaning and processing          #
#########################################
# author:   jbetley (https://github.com/jbetley)
# version:  0.9
# date:     02/21/24

# from typing import Tuple
import pandas as pd
import numpy as np
import itertools

from load_data import (
    get_adm_data,
    get_ahs_averages,
    get_corporation_academic_data,
    get_excluded_years,
    # get_graduation_data,
)

from calculations import (
    calculate_graduation_rate,
    calculate_ahs_average,
    calculate_sat_rate,
    calculate_proficiency,
    recalculate_total_proficiency,
)


def reorder_columns(data: pd.DataFrame, match_cols: list) -> list:
    """
    Takes a list of matching column names and interleaves the columns
    in the dataframe according to the order in the list.

    Args:
        data (pd.DataFrame): academic data
        match_cols (list): list of strings (column names)

    Returns:
        final_cols (list): list of inteleaved columns
    """
    col_list = []

    for i, col in enumerate(match_cols):
        col_list.append([c for c in data.columns if col in c])
        col_list[i].sort()

    final_cols = list(sum(zip(*col_list), ()))
    final_cols.insert(0, "Category")

    return final_cols


def check_total_tested(
    df: pd.DataFrame, school_id: str, school_type: str
) -> pd.DataFrame:
    """
    Drop all columns for a Category if the value of "Total Tested" for
    the Category for the school is null or 0. NOTE: This is essentially
    the same as the check in "Calculate Proficiency"- at some point should combine.

    Args:
    raw_df (pd.DataFrame): academic data
    school_id (str): the SchoolID
    school_type (str): the school type

    Returns:
        data (pd.DataFrame): df with null/0 categories removed
    """
    drop_columns = []

    data = df.copy()

    # School ID and school_id should both be type str
    data["School ID"] = data["School ID"].astype("Int64").astype("str")
    data["Corporation ID"] = data["Corporation ID"].astype("Int64").astype("str")

    if school_type == "K8":
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
                data[data["School ID"] == str(school_id)][col], errors="coerce"
            ).sum()
            == 0
            or data[data["School ID"] == str(school_id)][col].isnull().all()
        ):
            if "Total Tested" in col:
                match_string = " Total Tested"
            else:
                if school_type == "K8":
                    match_string = " Test N"
                else:
                    match_string = "|Cohort Count"

            matching_cols = data.columns[
                pd.Series(data.columns).str.startswith(col.split(match_string)[0])
            ]

            drop_columns.append(matching_cols.tolist())

    drop_all = [i for sub_list in drop_columns for i in sub_list]

    data = data.drop(drop_all, axis=1).copy()

    data = data.reset_index(drop=True)

    return data


def clean_adm_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Takes raw dataframe of adm data and produce display ready dataframe

    Args:
        df (pd.DataFrame): raw adm data

    Returns:
        final (pd.DataFrame): processed ADM dataframe
    """
    data = df.copy()

    # drop "Virtual ADM"
    data = data.drop(
        list(
            data.filter(
                regex="Fall Virtual ADM|Spring Virtual ADM|School ID|Corporation ID|Corporation Name|School Name"
            )
        ),
        axis=1,
    )

    # results = results.drop(
    #     list(
    #         results.filter(
    #             regex="Fall Virtual ADM|Spring Virtual ADM|Corporation ID|Name"
    #         )
    #     ),
    #     axis=1,
    # )

    # Each adm average requires 2 columns (Fall and Spring). If there are an
    # odd number of columns after the above drop, that means that the last
    # column is a Fall without a Spring, so we store that column, drop it,
    # and add it back later
    last_col = pd.DataFrame()

    if (len(data.columns) % 2) != 0:
        last_col_name = str(int(data.columns[-1][:4]) + 1)
        last_col[last_col_name] = data[data.columns[-1]]
        data = data.drop(data.columns[-1], axis=1)

    # get years with data
    adm_columns = [c[:4] for c in data.columns if "Spring" in c]

    # make numbers
    for col in data:
        data[col] = pd.to_numeric(data[col], errors="coerce")

    # Average each group of 2 columns and use name of 2nd column
    # (Spring) for result
    final = data.groupby(np.arange(len(data.columns)) // 2, axis=1).mean()
    final.columns = adm_columns

    if not last_col.empty:
        final[last_col_name] = last_col[last_col_name]

    return final


def transpose_data(raw_df: pd.DataFrame, school_type: str) -> pd.DataFrame:
    """
    Filters tested (nsize) cols and proficiency calculations into
    separate dataframes, performs some cleanup, including a transposition,
    moving years to column headers and listing categories in their own
    columns and then cross-merging the two. variables change depending on
    whether we are analyzing a school or a corporation

    Args:
    raw_df (pd.DataFrame): student level growth data
    school_type (str): the school type


    Returns:
        final_data (pd.DataFrame): processed and transposed dataframe
    """

    df = raw_df.copy()

    df = df.reset_index(drop=True)

    # First, determine whether df contains data for the charter school or
    # the geo school corporation. A school corporation will always have the
    # same School and Corporation Name and School and Corporation ID.
    # a charter school that is not part of a network will have the same
    # School and Corporation Name, but different School and Corporation IDs.
    # a charter school that IS part of a network may have the same or different
    # School and Corporation ID, but will have a different School and Corporation
    # Name. So we check whether the two sets of columns are equivalent and if
    # both are, the data must belong to a school corporation.
    if (
        (df["School ID"][0] == df["Corporation ID"][0])
        + (df["School Name"][0] == df["Corporation Name"][0])
    ) == 2:
        # NOTE: currently keeping record of N-Size data for both school and corp
        # although we do not currently use corp n-size
        nsize_id = "CN-Size"
        name_id = "Corp"
    else:
        nsize_id = "SN-Size"
        name_id = "School"

    # create dataframes with N-Size data for info/analysis pages
    if school_type == "AHS":
        # Three Graduation Rate measurements for AHS:
        #   Graduation to Enrollment =  AHS|Actual Graduates/ADM Average
        #   Grade 12 = AHS|Actual Graduates/AHS|Actual Enrollment
        #   Total (Cohort) = Total|Graduates/Total|Cohort Count

        # NOTE: CCR Percentage uses "|Count", grad rates use "|Cohort Count",
        # SAT uses "Total Tested"
        tested_cols = "Total Tested|Cohort Count|Count|Year"
        filter_cols = r"^Category|CCR Percentage|Grade 12\|Graduation Rate|Total\|Graduation Rate|ADM Average|Graduation to Enrollment\|Graduation Rate|Benchmark \%|Below|Approaching|At|^Year$"
        substring_dict = {
            " Total Tested": "",
            r"|Cohort Count": r"|Graduation",
            r"|Count": "",
        }

    elif school_type == "HS":
        tested_cols = r"Total Tested|Cohort Count|Year"
        filter_cols = r"^Category|Graduation Rate$|AHS|Pass Rate$|Benchmark %|Below|Approaching|At|^Year$"
        substring_dict = {r" Total Tested": "", r"|Cohort Count": r"|Graduation"}

    else:
        tested_cols = "Total Tested|Test N|Year"
        filter_cols = r"School ID|Corporation ID|Corporation Name|Low Grade|High Grade|\|ELA Proficient %$|\|Math Proficient %$|IREAD Proficient %|^Year$"
        substring_dict = {" Total Tested": "", " Test N": ""}

    # We get proficiency and cohort/tested (N-Size) data in separate dataframes,
    # convert the n-size category names into a substring of the data category
    # names and then merge the two dataframes based on a substring match
    # e.g., use the substring dict to convert "Graduation to Enrollment|Cohort Count" to
    # the substring "Graduation to Enrollment|Graduation" which matches
    # "Graduation to Enrollment|Graduation Rate"
    df.columns = df.columns.astype(str)

    tested_data = df.filter(regex=tested_cols, axis=1).copy()
    proficiency_data = df.filter(regex=filter_cols, axis=1).copy()

    tested_data = (
        tested_data.set_index("Year")
        .T.rename_axis("Category")
        .rename_axis(None, axis=1)
        .reset_index()
    )

    tested_data = tested_data.rename(
        columns={
            c: str(c) + nsize_id for c in tested_data.columns if c not in ["Category"]
        }
    )

    tested_data = tested_data.fillna(value=np.nan)
    tested_data = tested_data.replace(0, np.nan)

    if tested_data.empty:
        return tested_data

    # add new column with substring values and drop the original
    # Category column
    tested_data["Substring"] = tested_data["Category"].replace(
        substring_dict, regex=True
    )

    tested_data = tested_data.drop("Category", axis=1)

    proficiency_data = (
        proficiency_data.set_index("Year")
        .T.rename_axis("Category")
        .rename_axis(None, axis=1)
        .reset_index()
    )

    proficiency_data = proficiency_data.rename(
        columns={
            c: str(c) + name_id
            for c in proficiency_data.columns
            if c not in ["Category"]
        }
    )

    proficiency_data = proficiency_data.reset_index(drop=True)

    # temporarily store Low/High grade cols for K8
    if school_type == "K8":
        other_rows = proficiency_data[
            proficiency_data["Category"].str.contains(r"Low|High")
        ]

    proficiency_data = proficiency_data.fillna(value=np.nan)

    # Merge Total Tested DF with Proficiency DF based on substring match
    # NOTE: the cross-merge and substring match process takes about .3s,
    # is there a faster way?
    merged_data = proficiency_data.merge(tested_data, how="cross")

    # Need to temporarily rename "English Learner" because otherwise merge
    # will match both "English" and "Non English"
    merged_data = merged_data.replace(
        {
            "Non English Language Learners": "Temp1",
            "English Language Learners": "Temp2",
        },
        regex=True,
    )

    merged_data = merged_data[
        [a in b for a, b in zip(merged_data["Substring"], merged_data["Category"])]
    ]

    merged_data = merged_data.replace(
        {
            "Temp1": "Non English Language Learners",
            "Temp2": "English Language Learners",
        },
        regex=True,
    )

    merged_data = merged_data.drop("Substring", axis=1)
    merged_data = merged_data.reset_index(drop=True)

    # reorder and interleave columns
    final_cols = reorder_columns(merged_data, [name_id, nsize_id])

    final_data = merged_data[final_cols]

    # Add Low and High Grade rows back to k8 data and
    # create df for information figs
    if school_type == "K8":
        final_data = pd.concat(
            [final_data.reset_index(drop=True), other_rows.reset_index(drop=True)],
            axis=0,
        ).reset_index(drop=True)

    return final_data


def clean_academic_data(
    df: pd.DataFrame, school_list: list, school_type: str, year: str, location: str
) -> pd.DataFrame:
    """
    A big chonky function that takes raw academic data and processes it in
    different ways for multiple pages.

    Args:
        df (pd.DataFrame): raw academic data
        school_list (list): list of school(s)
        school_type (str): school type
        year (str): selected year

    Returns:
        data (pd.DataFrame): processed dataframe
    """
    raw_data = df.copy()
    
    school_id = school_list[0]
    
    # note: corp_id needs to be a str
    corp_id = raw_data[raw_data["School ID"] == school_id]["GEO Corp"].unique()[0].astype(str)

    is_analysis = False

    # school_list will either have one element, or be a list, if one
    # element, we are on the academic_information page, if more than
    # one, we are on the analysis page.
    if len(school_list) > 1:
        is_analysis = True

    # corp data (for academic_metrics and academic_analysis_single_year)
    # no corp data for AHS other than ahs grad average

    # if True, we are on academic analysis page and need comp
    # and corp data
    if is_analysis == True:

        if school_type == "AHS":
            raw_ahs_data = get_ahs_averages()
            corp_data = calculate_ahs_average(raw_ahs_data)
        else:
            corp_data = get_corporation_academic_data(corp_id, school_type)

        # add columns not in corp database
        corp_data["School ID"] = corp_data["Corporation ID"]
        corp_data["School Name"] = corp_data["Corporation Name"]

        with pd.option_context("future.no_silent_downcasting", True):
            corp_data = corp_data.fillna(value=np.nan)

        # merge - result includes school, school corp, and comparable schools if
        # multiple school ids in the schools variable
        school_data = pd.concat([raw_data, corp_data], axis=0)

    else:
        school_data = raw_data.copy()

    # Drop years of data that have been excluded by the
    # selected year (are later than)
    excluded_years = get_excluded_years(year, "academic")

    if excluded_years:
        school_data = school_data[~school_data["Year"].isin(excluded_years)]

    if len(school_data.index) < 1 or school_data.empty:
        return pd.DataFrame()

    school_data = school_data.sort_values(by="Year", ascending=False)

    school_data = school_data.reset_index(drop=True)

    # drop ELA and Math/EBRW and Math columns
    if school_type == "HS" or school_type == "AHS":
        school_data = school_data.drop(
            list(school_data.filter(regex="EBRW and Math")), axis=1
        )
    else:
        school_data = school_data.drop(
            list(school_data.filter(regex="ELA and Math")), axis=1
        )

    data = check_total_tested(school_data, school_id, school_type)

    # HS/AHS data
    if school_type == "HS" or school_type == "AHS":
        processed_data = data.copy()

        # In Cohort Grad Rate
        if "Total|Cohort Count" in processed_data.columns:
            processed_data = calculate_graduation_rate(processed_data)

        # SAT Benchmark proficiency
        if "Total|EBRW Total Tested" in processed_data.columns:
            processed_data = calculate_sat_rate(processed_data)

        # AHS only data
        if school_type == "AHS":

            ahs_data = processed_data.copy()
            if "AHS|CCR" in ahs_data.columns:
                ahs_data["AHS|CCR"] = pd.to_numeric(
                    ahs_data["AHS|CCR"], errors="coerce"
                )

            if "AHS|Actual Graduates" in ahs_data.columns:
                ahs_data["AHS|Actual Graduates"] = pd.to_numeric(
                    ahs_data["AHS|Actual Graduates"], errors="coerce"
                )

            # Student performance, dual-credit accumulation and/or industry
            # certification reflects college and career readiness, based on
            # the percentage of non-duplicated graduating students in the
            # current school year
            if {"AHS|CCR", "AHS|Actual Graduates"}.issubset(ahs_data.columns):
                ahs_data["CCR Percentage"] = (
                    ahs_data["AHS|CCR"] / ahs_data["AHS|Actual Graduates"]
                )

            # AHS|Actual Graduates is used in three calculations where we want to
            # track N-Size, "Graduation Graduation to Enrollment", "Grade 12
            # Graduation", and "CCR Percentage"
            ahs_data["Graduation to Enrollment|Cohort Count"] = ahs_data[
                "AHS|Actual Graduates"
            ]
            ahs_data["CCR Percentage|Count"] = ahs_data["AHS|Actual Graduates"]

            ahs_data = ahs_data.rename(
                columns={"AHS|Actual Graduates": "Grade 12|Cohort Count"}
            )

            if "AHS|Actual Enrollment" in ahs_data.columns:
                ahs_data["AHS|Actual Enrollment"] = pd.to_numeric(
                    ahs_data["AHS|Actual Enrollment"], errors="coerce"
                )

            # Students enrolled in grade 12 graduate within the school year being assessed.
            if {
                "AHS|Actual Enrollment",
                "Grade 12|Cohort Count",
            }.issubset(ahs_data.columns):
                ahs_data["Grade 12|Graduation Rate"] = (
                    ahs_data["Grade 12|Cohort Count"]
                    / ahs_data["AHS|Actual Enrollment"]
                )

            ## Graduation To Enrollment Calculation (AHS Accountability)
            # NOTE: a school must have at least ten (10) students graduate
            # in the school year being assessed. If school has fewer than ten
            # (10) graduates for a year based calculation on the current graduates
            # aggregated with each immediately preceding year's graduates until
            # a cohort of at least ten (10) graduates is reached

            # TODO: Get GEOCorp here as corp_id? or just corp_id
            # selected_school = get_school_index(school_id)
            # corp_id = int(selected_school["Corporation ID"].values[0])
            # corp_id = 9999
            # get adm average and add to dataframe matching on school_id and Year
            # TODO: Corp ID working from above?
            raw_adm = get_adm_data(corp_id)
            adm_average = clean_adm_data(raw_adm)

            school_adm = adm_average.T.rename_axis("Year").reset_index()
            school_adm = school_adm.rename(columns={0: "ADM Average"})
            school_adm["School ID"] = school_id

            for col in school_adm.columns:
                school_adm[col] = pd.to_numeric(school_adm[col], errors="coerce")

            ahs_data["School ID"] = ahs_data["School ID"].astype(int)

            processed_data = pd.merge(
                ahs_data,
                school_adm,
                how="left",
                on=["Year", "School ID"],
                suffixes=("", "_y"),
            )

            # need to convert back to str or else we get a numpy error around
            # line 1360 (data check)
            processed_data["School ID"] = ahs_data["School ID"].astype(str)

            # NOTE: graduation calculation proposed by AHS. This is not unlike
            # the Indiana Adult Accountability Graduation to Enrollment Percentage
            # calculation (weighted 90%). the denominator is the school's
            # within-year-average number of students (ADM average), the numerator
            # is the total number of graduates for the assessed year, and then
            # quotient is multiplied by 4
            processed_data["Graduation to Enrollment|Graduation Rate"] = (
                processed_data["Graduation to Enrollment|Cohort Count"]
                / processed_data["ADM Average"]
            ) * 4

            # "Grade 12 Grad Rate" and "Grad to Enrollment" are capped at 100%
            processed_data.loc[
                processed_data["Grade 12|Graduation Rate"] > 1,
                "Grade 12|Graduation Rate",
            ] = 1
            processed_data.loc[
                processed_data["Graduation to Enrollment|Graduation Rate"] > 1,
                "Graduation to Enrollment|Graduation Rate",
            ] = 1

    # K8 data
    elif school_type == "K8":
        processed_data = data.copy()

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

        revised_totals = recalculate_total_proficiency(comparison_data, school_data)

        processed_data = processed_data.set_index(["School ID", "Year"])
        processed_data.update(revised_totals.set_index(["School ID", "Year"]))

        # this is school, school corporation, and comparable school data
        processed_data = processed_data.reset_index()

    # the dataframe can be empty if all columns other than the 1st
    # Year are null or if the dataframe has no school_id
    if (
        processed_data.iloc[:, 1:].isna().all().all()
        or str(school_id) not in processed_data["School ID"].values
    ):
        return pd.DataFrame()

    else:
        ## Keep five years of data at most
        years = processed_data["Year"].unique().tolist()

        if len(years) > 5:
            keep_years = years[:5]
            processed_data = processed_data[processed_data["Year"].isin(keep_years)]

        # TODO add multipage analysis data processing here
        # TODO: (currently in get_multiyear_data)

        # analysis page (single?)
        if is_analysis == True:
            ## HS/AHS academic_analysis_single
            if school_type == "HS" or school_type == "AHS":
                hs_data = processed_data.copy()

                # NOTE: Cohort data (not currently kept): Actual Graduates,
                # Actual Enrollment, CCR
                if school_type == "AHS":
                    analysis_data = hs_data.filter(
                        regex=r"School ID|School Name|Low Grade|High Grade|Corporation ID|Corporation Name \
                        |CCR Percentage|Grade 12|Total\|Graduation Rate|Graduation to Enrollment|Total Student Count|Benchmark \%|^Year$",
                        axis=1,
                    ).copy()
                else:
                    analysis_data = hs_data.filter(
                        regex=r"School ID|School Name|Low Grade|High Grade|Corporation ID|Corporation Name|Graduation Rate$|Total Student Count|Benchmark \%|^Year$",
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

                pd.set_option('display.max_columns', None)
                pd.set_option('display.max_rows', None) 

                # get index of rows where school_id matches selected school (TODO: Just the first row?)
                school_idx = analysis_data.index[
                    analysis_data["School ID"] == str(school_id)
                ].tolist()[0]

                for col in hs_cols:
                    analysis_data[col] = pd.to_numeric(
                        analysis_data[col], errors="coerce"
                    )

                # drop all columns where the row at school_name_idx has a NaN value
                analysis_data = analysis_data.loc[:, ~hs_data.iloc[school_idx].isna()]

                # want all IDs to be strings throughout the process
                analysis_data["School ID"] = analysis_data["School ID"].astype(str)
                analysis_data["Corporation ID"] = analysis_data["Corporation ID"].astype(str)
                
                return analysis_data

            ## K8 academic_analysis_single
            else:
                # TODO: testing unfiltered data
                # k8_data = processed_data.copy()
                analysis_data = processed_data.copy()
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

                # TODO: Is there a K12?
                # one last check
                if (
                    (school_type == "K8" or school_type == "K12")
                    and len(analysis_data.index) > 0
                ) and check_for_unchartable_data.isnull().all().all() == True:
                    
                    analysis_data = pd.DataFrame()
                    return analysis_data

                else:
                    
                    # want all IDs to be strings throughout the process
                    analysis_data["School ID"] = analysis_data["School ID"].astype(str)
                    analysis_data["Corporation ID"] = analysis_data["Corporation ID"].astype(str)
                
                    return analysis_data

        # TODO: ORIGINAL AND NEW ARE IDENTICAL (EXCEPT M/F) for single school
        # TODO: TEST SAME FOR ANALYSIS
        else:

            final_school_data = processed_data[
                processed_data["School ID"] == str(school_id)
            ].copy()

            # want all IDs to be strings throughout the process
            final_school_data["School ID"] = final_school_data["School ID"].astype(str)
            final_school_data["Corporation ID"] = final_school_data["Corporation ID"].astype(str)
            
            return final_school_data