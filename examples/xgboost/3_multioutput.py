"""Several answers at once: did they survive AND which class did they travel in?"""
from sklearn.model_selection import train_test_split
from sklearn.multioutput import MultiOutputClassifier
from xgboost import XGBClassifier
from common import load

df = load()
df["pclass"] -= 1
X, Y = df.drop(columns=["survived", "pclass"]), df[["survived", "pclass"]]
X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size=0.2, random_state=42)

# Under the hood: one whole model per thing you want to predict.
model = MultiOutputClassifier(XGBClassifier(n_estimators=200, max_depth=3, learning_rate=0.1))
model.fit(X_train, Y_train)

pred = model.predict(X_test)
for i, target in enumerate(Y.columns):
    print(f"{target} accuracy: {(pred[:, i] == Y_test[target].values).mean():.1%}")
