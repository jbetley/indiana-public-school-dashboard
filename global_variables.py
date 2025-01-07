#########################################
# ICSB Public School Academic Dashboard #
# global variables                      #
#########################################
# author:   jbetley (https://github.com/jbetley)
# version:  0.9
# date:     02/21/24

max_display_years = 5

# Colors
# https://codepen.io/ctf0/pen/BwLezW
color = [
    "#7b6888",
    "#df8f2d",
    "#a8b462",
    "#ebbb81",
    "#74a2d7",
    "#d4773f",
    "#83941f",
    "#f0c33b",
    "#bc986a",
    "#96b8db",
]

subject = ["Math", "ELA"]

info_categories = ["School Name", "Low Grade", "High Grade"]

ethnicity = [
    "American Indian",
    "Asian",
    "Black",
    "Hispanic",
    "Multiracial",
    "Native Hawaiian or Other Pacific Islander",
    "White",
]

subgroup = [
    "Special Education",
    "General Education",
    "Paid Meals",
    "Free or Reduced Price Meals",
    "English Language Learners",
    "Non English Language Learners",
]

grades = ["Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"]

grades_all = ["Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Total"]

grades_ordinal = ["3rd", "4th", "5th", "6th", "7th", "8th"]

# default table styles
table_style = {"border": "none", "fontFamily": "Inter, sans-serif"}

table_cell = {
    "whiteSpace": "normal",
    "height": "auto",
    "textAlign": "center",
    "color": "#6783a9",
    "minWidth": "25px",
    "width": "25px",
    "maxWidth": "25px",
}

table_header = {
    "backgroundColor": "#ffffff",
    "fontSize": "12px",
    "fontFamily": "Montserrat, sans-serif",
    "color": "#6783a9",
    "textAlign": "center",
    "fontWeight": "bold",
    "border": "none",
}
