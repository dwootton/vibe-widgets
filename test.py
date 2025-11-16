import pandas as pd
import vibe_widget as vw

df = pd.DataFrame({
    'height': [150, 160, 170, 180, 190],
    'weight': [50, 60, 70, 80, 90]
})

vw.create("an interactive scatterplot of height and weight", df)