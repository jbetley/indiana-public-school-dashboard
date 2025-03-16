#########################################
# ICSB Public School Academic Dashboard #
# main application & backend            #
#########################################
# author:   jbetley (https://github.com/jbetley)
# version:  0.9  # noqa: ERA001
# date:     01/06/25

# https://www.geeksforgeeks.org/connect-flask-to-a-database-with-flask-sqlalchemy/
# https://realpython.com/flask-javascript-frontend-for-rest-api/

# https://www.codium.ai/blog/flask-sqlalchemy-dynamic-database-tutorial/
# https://stackoverflow.com/questions/7689695/passing-variables-between-python-and-
# javascript
# https://blog.logrocket.com/build-interactive-charts-flask-d3js/

import numpy as np
import pandas as pd
from calculations import calculate_comparison_school_list
from flask import (
    Flask,
    render_template,
    request,
)

# local imports
from load_data import (
    current_academic_year,
    current_demographic_year,
    get_academic_data,
    get_available_years,
    get_demographic_data,
    get_public_dropdown,
    get_school_coordinates,
)
from process_data import clean_academic_data

# basedir = os.path.abspath(os.path.dirname(__file__))  # noqa: ERA001

app = Flask(__name__, static_folder="./modules")
# app.config['SQLALCHEMY_DATABASE_URI'] =\  # noqa: ERA001, RUF100
#         'sqlite:///' + os.path.join(basedir, 'database.db')  # noqa: ERA001
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # noqa: ERA001
# db = SQLAlchemy(app)  # noqa: ERA001


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/config", methods=["GET"])
def load_config():

    # these are global values  calculated in load_data
    return {
        "academic_year": current_academic_year,
        "demographic_year": current_demographic_year,
    }


# school dropdown list
@app.route("/load", methods=["GET"])
def load_school_dropdown():

    school_df = get_public_dropdown()
    school_df = school_df.sort_values(
        ["Corporation Name", "School Name"], ascending=[True, True])

    return [
        {k: v for k, v in m.items() if v == v and v is not None}
        for m in school_df.to_dict(orient="records")
    ]


# comparison schools list
@app.route("/where", methods=["POST"])
def load_school_coordinates():

    selections = request.get_json()
    school_id = selections["school_id"]
    year = int(selections["year"])
    school_type = selections["school_type"]

    # get coordinates for all schools for a year
    coordinates = get_school_coordinates(year, school_type)

    # Drop any school not testing at least 20 students (probably only
    # impacts ~20 schools). the second condition ensures that the school
    # is retained if it exists
    coordinates["Total Student Count"] = coordinates[
        "Total Student Count"
    ].replace("", np.nan)

    coordinates = coordinates.dropna(subset=["Total Student Count"])

    coordinates["Total Student Count"] = pd.to_numeric(
        coordinates["Total Student Count"], errors="coerce")

    coordinates = coordinates[
        (coordinates["Total Student Count"].astype(int) >= 30)
        | (coordinates["School ID"] == int(school_id))
    ]

    # NOTE: Before we do the distance check, we reduce the size of the
    # df removing schools where there is no or only one grade overlap
    # between the comparison schools.the variable "overlap" is one less
    # than the the number of grades that we want as a minimum (a value
    # of "1" means a 2 grade overlap, "2" means 3 grade overlap, etc.).
    # coordinates = check_for_gradespan_overlap(selections, coordinates)  # noqa: ERA001

# TODO: Add School Type Here to filter out unrelated schools from the list
# TODO: MS are still showing up for IREAD - NEED TO DROP THEM
    # use scipy.spatial KDTree method to calculate distances from given school_id
    return calculate_comparison_school_list(selections, coordinates, 20)


@app.route("/demographic", methods=["post"])
def load_demographic_data():

    data = request.get_json()

    all_demographic_data = get_demographic_data(data)

    all_demographic_data = all_demographic_data.sort_values(by="Year")

    all_demographic_data.columns = all_demographic_data.columns.str.replace(
        "Native Hawaiian or Other Pacific Islander", "Pacific Islander",
        regex=True)

    all_demographic_data_object = [
        {k: v for k, v in m.items() if v == v and v is not None}
        for m in all_demographic_data.to_dict(orient="records")
    ]

    return [all_demographic_data_object]


@app.route("/years", methods=["POST"])
def get_years():

    data = request.get_json()

    print(data)

    school_id = int(data["school_id"])

    # school_subtype for K12 will either be K8 or HS, school_subtype
    # for K8 will be ES, MS, or K8

    if data["school_type"] == "K12":
        if data["school_subtype"] == "K12":
            school_type = "HS" if data["type_tab"] == "hsTab" else "K8"
        else:
            school_type = data["school_subtype"]
    else:
        school_type = data["school_type"]

    category = data["k8_tab"] if school_type == "K8" else data["hs_tab"]

    available_years = get_available_years(school_id, category)

    print(available_years)

    return available_years


# academic data
@app.route("/academic", methods=["POST"])
def load_academic_data():

    data = request.get_json()

    schools = [int(data["school_id"])] + data["comparison_schools"]

    # school_subtype for K12 will either be K8 or HS, school_subtype
    # for K8 will be ES, MS, or K8

    if data["school_type"] == "K12":
        if data["school_subtype"] == "K12":
            school_type = "HS" if data["type_tab"] == "hsTab" else "K8"
        else:
            school_type = data["school_subtype"]
    else:
        school_type = data["school_type"]

    raw_data = get_academic_data(schools, school_type)

    data = clean_academic_data(
        raw_data,
        schools,
        school_type,
        data["year"],
        data["page_tab"],
    )

    # df is empty or only has information cols (e.g., MS for IREAD data)
    if len(data.columns) <= 6:
        return_values = []

    else:
        # # clarify school type (NOTE: Bake this in to clean_data?)
        # gradespan = get_gradespan(data["school_id"], data["school_type"],
        # data["year"])

        data = data.sort_values(by="Year")

        data.columns = data.columns.str.replace(
            "English Language", "English", regex=True)

# TODO: Check to see if we are even loading Pacific Islander data ..
        data.columns = data.columns.str.replace(
            "Native Hawaiian or Other Pacific Islander", "Pacific Islander",
            regex=True)

        school_proficiency = [
            {k: v for k, v in m.items() if v == v and v is not None}
            for m in data.to_dict(orient="records")
        ]

        return_values = [school_proficiency]

    return return_values


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)  # noqa: S104, S201
