#########################################
# ICSB Public School Academic Dashboard #
# main application & backend            #
#########################################
# author:   jbetley (https://github.com/jbetley)
# version:  0.9
# date:     01/06/25

# https://www.geeksforgeeks.org/connect-flask-to-a-database-with-flask-sqlalchemy/
# https://realpython.com/flask-javascript-frontend-for-rest-api/

# https://www.codium.ai/blog/flask-sqlalchemy-dynamic-database-tutorial/
# https://stackoverflow.com/questions/7689695/passing-variables-between-python-and-javascript
# https://blog.logrocket.com/build-interactive-charts-flask-d3js/

import pandas as pd
import numpy as np
from flask import (
    Flask,
    render_template,
    request,
)

# local imports
from load_data import (
    current_academic_year,
    current_demographic_year,
    get_public_dropdown,
    # get_academic_data,
    get_demographic_data,
    get_school_coordinates,
    get_academic_data,
)
from calculations import calculate_comparison_school_list, check_for_gradespan_overlap
from process_data import clean_academic_data

# basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__, static_folder="./modules")
# app.config['SQLALCHEMY_DATABASE_URI'] =\
#         'sqlite:///' + os.path.join(basedir, 'database.db')
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# db = SQLAlchemy(app)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/config", methods=["GET"])
def load_config():

    # these are global values  calculated in load_data
    data = {
        "academic_year": current_academic_year,
        "demographic_year": current_demographic_year,
    }
    return data


# school dropdown list
@app.route("/load", methods=["GET"])
def load_school_dropdown():
    school_df = get_public_dropdown()

    dropdown_list = [
        {k: v for k, v in m.items() if v == v and v is not None}
        for m in school_df.to_dict(orient="records")
    ]

    return dropdown_list


# comparison schools list
@app.route("/where", methods=["POST"])
def load_school_coordinates():
    data = request.get_json()

    school_id = data["school_id"]
    year = int(data["year"])
    school_type = data["school_type"]

    # get coordinates for all schools for a year
    # TODO: hardcoded temporarily until all other errors fixed
    if year == 2024:
        year = 2023

    coordinates = get_school_coordinates(year, school_type)

    # Drop any school not testing at least 20 students. "Total|ELATotalTested"
    # is a proxy for school size here (probably only impacts ~20 schools)
    # the second condition ensures that the school is retained if it exists
    if school_type == "K8":

        coordinates["Total|ELA Total Tested"] = coordinates[
            "Total|ELA Total Tested"
        ].replace("", np.nan)

        coordinates = coordinates.dropna(subset=["Total|ELA Total Tested"])

        coordinates["Total|ELA Total Tested"] = pd.to_numeric(
            coordinates["Total|ELA Total Tested"], errors="coerce"
        )

        coordinates = coordinates[
            (coordinates["Total|ELA Total Tested"].astype(int) >= 20)
            | (coordinates["School ID"] == int(school_id))
        ]

    # NOTE: Before we do the distance check, we reduce the size of the df removing
    # schools where there is no or only one grade overlap between the comparison schools.
    # the variable "overlap" is one less than the the number of grades that we want as a
    # minimum (a value of "1" means a 2 grade overlap, "2" means 3 grade overlap, etc.).
    coordinates = check_for_gradespan_overlap(school_id, coordinates)

    # use scipy.spatial KDTree method to calculate distances from given school_id
    comparison_list = calculate_comparison_school_list(school_id, coordinates, 20)

    # Set default display selections to all schools in the list - want to return
    # a list of school IDs
    # default_options = [id for name, id in comparison_list.items()]

    return comparison_list


@app.route("/demographic", methods=["post"])
def load_demographic_data():

    data = request.get_json()

    all_demographic_data = get_demographic_data(data)

    all_demographic_data = all_demographic_data.sort_values(by="Year")

    all_demographic_data_object = [
        {k: v for k, v in m.items() if v == v and v is not None}
        for m in all_demographic_data.to_dict(orient="records")
    ]

    return_values = [all_demographic_data_object]

    return return_values


# academic data
@app.route("/academic", methods=["POST"])
def load_academic_data():
    data = request.get_json()

    # print("ORIGINAL")
    # proficiency_data = get_academic_data(
    #     data["school_id"], data["school_type"], data["year"], data["comparison_schools"]
    # )

    # print(proficiency_data)
    # filename98 = "original_data.csv"
    # proficiency_data.to_csv(filename98, index=False)

    schools = [data["school_id"]] + data["comparison_schools"]

    raw_proficiency_data = get_academic_data(schools, data["school_type"])

    # TODO: DIFFERENCES for Academic Info between original and New
    #   1) delete cols with nan/blank/zero
    #   2) delete ELA and Math
    #   3) run all proficiency calculations

    # TODO: Difference for Analysis
    #   1) same as above
    #   2) original does not have school data?
    #   3) new version does not have corp data

    proficiency_data = clean_academic_data(
        raw_proficiency_data,
        schools,
        # data["comparison_schools"],
        data["school_type"],
        data["year"],
    )

    # print("UPDATED")
    # if len(proficiency_data.index) > 0:
    #     filename99 = "clean_proficiency_data.csv"
    #     proficiency_data.to_csv(filename99, index=False)

    # TODO: Add Check Here
    # if proficiency_data.empty:
    proficiency_data = proficiency_data.sort_values(by="Year")

    school_proficiency = [
        {k: v for k, v in m.items() if v == v and v is not None}
        for m in proficiency_data.to_dict(orient="records")
    ]

    return_values = [school_proficiency]

    # print("FINAL ACAD DATA")
    # print(return_values)

    return return_values


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)
