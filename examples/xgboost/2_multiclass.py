"""One answer out of several: which ticket class (1st / 2nd / 3rd) did they travel in?"""
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier
from common import load

df = load()
X, y = df.drop(columns="pclass"), df["pclass"] - 1          # classes must be 0, 1, 2
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = XGBClassifier(objective="multi:softprob", n_estimators=200, max_depth=3, learning_rate=0.1)
model.fit(X_train, y_train)

print(f"accuracy: {model.score(X_test, y_test):.1%}")
print("P(1st, 2nd, 3rd) for first test passenger:", model.predict_proba(X_test[:1])[0].round(3))
