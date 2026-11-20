"""One yes/no answer: did this passenger survive?"""
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier
from common import load

df = load()
X, y = df.drop(columns="survived"), df["survived"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = XGBClassifier(n_estimators=200, max_depth=3, learning_rate=0.1)
model.fit(X_train, y_train)

print(f"accuracy: {model.score(X_test, y_test):.1%}")
print("P(survived) for first test passenger:", model.predict_proba(X_test[:1])[0, 1].round(3))
