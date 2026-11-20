"""Shared Titanic loading for the three XGBoost examples (891 passengers)."""
import pandas as pd

URL = "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/titanic.csv"


def load():
    df = pd.read_csv(URL)[["survived", "pclass", "sex", "age", "sibsp", "parch", "fare", "embarked"]]
    df["sex"] = (df["sex"] == "male").astype(int)                     # text -> number, by hand
    df["embarked"] = df["embarked"].map({"S": 0, "C": 1, "Q": 2})     # text -> number, by hand
    return df
