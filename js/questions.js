/**
 * Offline Diagnostic Question Bank for SkillSync AI.
 * Contains 3 easy + 2 hard technically accurate MCQs for every skill in the catalog.
 * Note: The JSON block between markers is also parsed directly by app.py as the
 * server-side offline fallback for /api/ai-quiz so there is zero question duplication.
 */
window.SkillSyncQuestions = (function () {
  /* QUESTION_BANK_JSON_START */
  const QUESTION_BANK = {
    "sql": [
      {
        "id": "sql_e1",
        "difficulty": "easy",
        "question": "Which SQL clause filters rows BEFORE grouping or aggregation occurs?",
        "options": ["WHERE", "HAVING", "ORDER BY", "GROUP BY"],
        "correctAnswer": 0,
        "explanation": "WHERE filters individual rows prior to GROUP BY aggregation, whereas HAVING filters aggregated groups."
      },
      {
        "id": "sql_e2",
        "difficulty": "easy",
        "question": "What does an INNER JOIN return when joining two tables?",
        "options": [
          "Only rows with matching join keys in both tables",
          "All rows from the left table and matching rows from the right",
          "All rows from both tables regardless of match",
          "Only unmatched rows from the left table"
        ],
        "correctAnswer": 0,
        "explanation": "INNER JOIN keeps only rows where the join condition matches in both tables."
      },
      {
        "id": "sql_e3",
        "difficulty": "easy",
        "question": "Which SQL function counts the number of non-NULL values in a column?",
        "options": ["COUNT(column_name)", "SUM(column_name)", "TOTAL(column_name)", "ROWS(column_name)"],
        "correctAnswer": 0,
        "explanation": "COUNT(column_name) counts non-NULL entries in that column, while COUNT(*) counts all rows."
      },
      {
        "id": "sql_h1",
        "difficulty": "hard",
        "question": "In a LEFT JOIN query, you put `right_table.status = 'active'` inside the WHERE clause instead of the ON clause. What happens to left rows with no matching right row?",
        "options": [
          "They are filtered out, turning the query effectively into an INNER JOIN",
          "They stay with NULL for right_table.status",
          "SQL raises a syntax error",
          "They are duplicated for every active row"
        ],
        "correctAnswer": 0,
        "explanation": "Filtering a right-table column in WHERE eliminates NULL-padded rows unless you also allow IS NULL or move the filter to ON."
      },
      {
        "id": "sql_h2",
        "difficulty": "hard",
        "question": "Which window function assigns consecutive ranks (1, 2, 2, 3) with NO gaps when two rows tie?",
        "options": ["DENSE_RANK()", "RANK()", "ROW_NUMBER()", "NTILE()"],
        "correctAnswer": 0,
        "explanation": "DENSE_RANK() assigns equal ranks to ties without skipping numbers, whereas RANK() skips the next rank."
      }
    ],
    "power_bi": [
      {
        "id": "pbi_e1",
        "difficulty": "easy",
        "question": "Which Power BI component is used to clean, split, and transform raw source data before loading it into the model?",
        "options": ["Power Query Editor", "DAX Studio", "Report Canvas", "Bookmarks Pane"],
        "correctAnswer": 0,
        "explanation": "Power Query Editor handles ETL steps (extract, transform, load) using M before data enters the semantic model."
      },
      {
        "id": "pbi_e2",
        "difficulty": "easy",
        "question": "What language is used to write custom calculated columns and dynamic measures in Power BI?",
        "options": ["DAX", "SQL", "YAML", "Liquid"],
        "correctAnswer": 0,
        "explanation": "Data Analysis Expressions (DAX) powers measures and calculated columns in Power BI semantic models."
      },
      {
        "id": "pbi_e3",
        "difficulty": "easy",
        "question": "Which schema design is Microsoft's recommended best practice for Power BI data models?",
        "options": ["Star schema", "Single flat wide table with duplicated text", "Snowflake with bi-directional joins everywhere", "Many-to-many unlinked tables"],
        "correctAnswer": 0,
        "explanation": "A star schema (central fact table joined to clean dimension tables) optimizes DAX simplicity and VertiPaq speed."
      },
      {
        "id": "pbi_h1",
        "difficulty": "hard",
        "question": "Why should you prefer a DAX Measure over a Calculated Column for ratios like Profit Margin = Profit / Revenue?",
        "options": [
          "Measures evaluate dynamically in filter context at query time instead of summing pre-computed row ratios",
          "Calculated columns cannot divide numeric fields",
          "Measures automatically export directly to SQL Server",
          "Calculated columns are never stored in memory"
        ],
        "correctAnswer": 0,
        "explanation": "Summing row-level ratio columns produces mathematically wrong aggregates; measures recompute over current filter context."
      },
      {
        "id": "pbi_h2",
        "difficulty": "hard",
        "question": "In DAX, what does `CALCULATE(SUM(Sales[Amount]), ALL(Sales[Region]))` return inside a table sliced by Region?",
        "options": [
          "Total Sales across all regions, ignoring the Region filter on that visual",
          "Only sales where Region is blank",
          "A syntax error because ALL cannot modify CALCULATE",
          "Sales grouped by Region in ascending order"
        ],
        "correctAnswer": 0,
        "explanation": "ALL(Sales[Region]) removes the filter context on Region inside CALCULATE, commonly used as the denominator for % of total."
      }
    ],
    "statistics": [
      {
        "id": "stat_e1",
        "difficulty": "easy",
        "question": "Which measure of central tendency is least affected by extreme outliers?",
        "options": ["Median", "Arithmetic Mean", "Range", "Variance"],
        "correctAnswer": 0,
        "explanation": "The median depends only on the middle ordered value(s), making it robust to extreme skewed outliers."
      },
      {
        "id": "stat_e2",
        "difficulty": "easy",
        "question": "If a dataset has a standard deviation of 0, what must be true about its values?",
        "options": [
          "All values in the dataset are identical",
          "The mean must also be 0",
          "Half the values are negative and half are positive",
          "The dataset follows a skewed distribution"
        ],
        "correctAnswer": 0,
        "explanation": "Standard deviation measures spread around the mean; zero spread means every observation equals the mean."
      },
      {
        "id": "stat_e3",
        "difficulty": "easy",
        "question": "In hypothesis testing, what is the null hypothesis (H0) usually stating?",
        "options": [
          "There is no effect or no difference between groups",
          "The alternative model is 100% proven",
          "Sample size is larger than the population",
          "Correlation implies causation"
        ],
        "correctAnswer": 0,
        "explanation": "The null hypothesis represents the baseline assumption of no effect or difference until evidence suggests otherwise."
      },
      {
        "id": "stat_h1",
        "difficulty": "hard",
        "question": "An A/B test produces a p-value of 0.03 at alpha = 0.05. Which statement accurately interprets p = 0.03?",
        "options": [
          "Assuming H0 is true, there is a 3% probability of observing a result at least this extreme",
          "There is a 97% probability that H0 is permanently false",
          "The treatment improved revenue by exactly 3%",
          "There is a 3% chance the experiment had sampling bias"
        ],
        "correctAnswer": 0,
        "explanation": "A p-value is P(data at least this extreme | H0 is true), NOT the posterior probability that H0 is true or false."
      },
      {
        "id": "stat_h2",
        "difficulty": "hard",
        "question": "Why does increasing the number of simultaneous KPI hypothesis tests without correction increase false positives?",
        "options": [
          "Family-wise Type I error rate compounds across multiple comparisons",
          "Variance shrinks to zero when more metrics are added",
          "Standard error doubles for every additional column",
          "It violates the Central Limit Theorem for means"
        ],
        "correctAnswer": 0,
        "explanation": "Testing 20 unrelated metrics at alpha = 0.05 yields ~1 false positive by chance unless adjusted (e.g., Bonferroni or FDR)."
      }
    ],
    "python": [
      {
        "id": "py_e1",
        "difficulty": "easy",
        "question": "Which Python built-in data type is ordered, mutable, and allows duplicate elements?",
        "options": ["list", "tuple", "set", "frozenset"],
        "correctAnswer": 0,
        "explanation": "Python lists preserve order, allow duplicates, and support in-place mutation."
      },
      {
        "id": "py_e2",
        "difficulty": "easy",
        "question": "What keyword defines a function in Python?",
        "options": ["def", "func", "function", "lambda_def"],
        "correctAnswer": 0,
        "explanation": "Functions in Python are declared using the `def` keyword."
      },
      {
        "id": "py_e3",
        "difficulty": "easy",
        "question": "What does `len({'a': 1, 'b': 2, 'c': 3})` return?",
        "options": ["3", "6", "2", "TypeError"],
        "correctAnswer": 0,
        "explanation": "len() on a dictionary returns the number of key-value pairs, which is 3."
      },
      {
        "id": "py_h1",
        "difficulty": "hard",
        "question": "What is the pitfall of writing `def add_item(x, items=[]): items.append(x); return items`?",
        "options": [
          "The default list `items` is created once at function definition and shared across calls",
          "Python forbids lists as default arguments at compile time",
          "items is reset to None on every second call",
          "append() returns a new copy instead of modifying items"
        ],
        "correctAnswer": 0,
        "explanation": "Mutable default arguments persist across invocations; use `items=None` and initialize inside the function."
      },
      {
        "id": "py_h2",
        "difficulty": "hard",
        "question": "Why does `(x * 2 for x in range(1000000))` use far less memory than `[x * 2 for x in range(1000000)]`?",
        "options": [
          "A generator expression yields values lazily one at a time instead of allocating the full list",
          "Tuples compress integers in C automatically",
          "List comprehensions store strings instead of ints",
          "Generators run in a separate process without RAM"
        ],
        "correctAnswer": 0,
        "explanation": "Generator expressions compute items on demand during iteration with O(1) memory overhead."
      }
    ],
    "excel": [
      {
        "id": "xls_e1",
        "difficulty": "easy",
        "question": "Which Excel syntax locks both the column and row of cell B2 when copying a formula?",
        "options": ["$B$2", "B$2", "$B2", "#B#2"],
        "correctAnswer": 0,
        "explanation": "Dollar signs before both column and row ($B$2) create an absolute reference that stays fixed when copied."
      },
      {
        "id": "xls_e2",
        "difficulty": "easy",
        "question": "Which Excel feature lets you quickly summarize, group, and cross-tabulate large tables without writing formulas?",
        "options": ["PivotTable", "Goal Seek", "Data Validation", "Conditional Formatting"],
        "correctAnswer": 0,
        "explanation": "PivotTables aggregate rows and columns interactively by dragging fields into Rows, Columns, and Values."
      },
      {
        "id": "xls_e3",
        "difficulty": "easy",
        "question": "Which function returns the sum of values in a range that meet a single criterion?",
        "options": ["SUMIF", "COUNTIF", "VLOOKUP", "IFERROR"],
        "correctAnswer": 0,
        "explanation": "SUMIF(range, criteria, [sum_range]) adds cells matching the specified condition."
      },
      {
        "id": "xls_h1",
        "difficulty": "hard",
        "question": "Why is XLOOKUP or INDEX/MATCH generally preferred over VLOOKUP for corporate models?",
        "options": [
          "They can look up columns to the left and don't break when columns are inserted",
          "VLOOKUP only works on numeric IDs",
          "INDEX/MATCH automatically refreshes SQL connections",
          "VLOOKUP cannot do exact matches"
        ],
        "correctAnswer": 0,
        "explanation": "VLOOKUP hardcodes a column index number and only searches rightward, whereas XLOOKUP and INDEX/MATCH are resilient."
      },
      {
        "id": "xls_h2",
        "difficulty": "hard",
        "question": "What does `=SUMIFS(C2:C100, A2:A100, \"East\", B2:B100, \">1000\")` compute?",
        "options": [
          "Total of C2:C100 where A is East AND B is greater than 1000",
          "Total where EITHER A is East OR B is greater than 1000",
          "Count of rows matching East and >1000",
          "Average of C2:C100 for the East region"
        ],
        "correctAnswer": 0,
        "explanation": "SUMIFS applies logical AND across all range/criteria pairs, summing C2:C100 only where all conditions hold."
      }
    ],
    "javascript": [
      {
        "id": "js_e1",
        "difficulty": "easy",
        "question": "Which keyword declares a block-scoped variable whose binding cannot be reassigned?",
        "options": ["const", "var", "let", "static"],
        "correctAnswer": 0,
        "explanation": "`const` creates a block-scoped read-only binding (though object/array contents can still be mutated)."
      },
      {
        "id": "js_e2",
        "difficulty": "easy",
        "question": "Which array method returns a NEW array containing only elements that pass a test function?",
        "options": ["filter()", "forEach()", "reduce()", "push()"],
        "correctAnswer": 0,
        "explanation": "Array.prototype.filter() returns a shallow new array of elements for which the callback returns truthy."
      },
      {
        "id": "js_e3",
        "difficulty": "easy",
        "question": "What is the result of `typeof null` in JavaScript?",
        "options": ["\"object\"", "\"null\"", "\"undefined\"", "\"boolean\""],
        "correctAnswer": 0,
        "explanation": "Due to a historical quirk from JS's first implementation, `typeof null` evaluates to \"object\"."
      },
      {
        "id": "js_h1",
        "difficulty": "hard",
        "question": "In the JavaScript event loop, which runs first after the current synchronous call stack finishes?",
        "options": [
          "Microtasks (Promise.then callbacks)",
          "Macrotasks (setTimeout(..., 0) callbacks)",
          "requestAnimationFrame paint callbacks",
          "setInterval timers"
        ],
        "correctAnswer": 0,
        "explanation": "The microtask queue (Promise callbacks) drains completely after each synchronous task before the next macrotask."
      },
      {
        "id": "js_h2",
        "difficulty": "hard",
        "question": "What does `===` compare differently than `==` in JavaScript?",
        "options": [
          "Strict equality checks both value and type without implicit type coercion",
          "Strict equality performs deep structural comparison of objects",
          "Loose equality checks memory addresses while === checks values",
          "There is no difference for strings and numbers"
        ],
        "correctAnswer": 0,
        "explanation": "`===` avoids type coercion (e.g., `0 === '0'` is false, while `0 == '0'` is true)."
      }
    ],
    "git": [
      {
        "id": "git_e1",
        "difficulty": "easy",
        "question": "Which command stages modified files for the next Git commit?",
        "options": ["git add", "git push", "git branch", "git clone"],
        "correctAnswer": 0,
        "explanation": "`git add` moves changes from the working directory into the staging area (index)."
      },
      {
        "id": "git_e2",
        "difficulty": "easy",
        "question": "Which command shows the current branch, staged changes, and untracked files?",
        "options": ["git status", "git log", "git remote", "git merge"],
        "correctAnswer": 0,
        "explanation": "`git status` summarizes working tree and staging area state."
      },
      {
        "id": "git_e3",
        "difficulty": "easy",
        "question": "What does `git clone <url>` do?",
        "options": [
          "Copies a remote repository including its full commit history locally",
          "Uploads local commits to GitHub",
          "Creates a new empty branch",
          "Deletes untracked local files"
        ],
        "correctAnswer": 0,
        "explanation": "`git clone` initializes a local copy of a remote repo with origin configured."
      },
      {
        "id": "git_h1",
        "difficulty": "hard",
        "question": "How does `git revert <commit>` differ from `git reset --hard <commit>` on a shared branch?",
        "options": [
          "git revert creates a new inverse commit safely preserving history; reset rewrites commit history",
          "git revert deletes the branch permanently",
          "git reset pushes changes automatically to origin",
          "Both commands rewrite history identically"
        ],
        "correctAnswer": 0,
        "explanation": "Reverting adds a forward commit that undoes changes without breaking teammates' histories on shared branches."
      },
      {
        "id": "git_h2",
        "difficulty": "hard",
        "question": "What happens during `git rebase main` while checked out on `feature`?",
        "options": [
          "Feature commits are replayed sequentially on top of the latest main commit",
          "All commits in main are squashed into feature",
          "Git deletes local uncommitted changes automatically",
          "A merge commit with two parents is always created"
        ],
        "correctAnswer": 0,
        "explanation": "Rebasing creates new commit hashes for your feature commits atop the updated base branch for a linear history."
      }
    ],
    "data_viz": [
      {
        "id": "dv_e1",
        "difficulty": "easy",
        "question": "Which chart type is best suited for showing a metric's trend continuously over time?",
        "options": ["Line chart", "Pie chart", "Radar chart", "Treemap"],
        "correctAnswer": 0,
        "explanation": "Line charts naturally connect sequential time intervals to reveal trends and seasonality."
      },
      {
        "id": "dv_e2",
        "difficulty": "easy",
        "question": "Which chart displays the relationship between two continuous numeric variables?",
        "options": ["Scatter plot", "Bar chart", "Donut chart", "Funnel chart"],
        "correctAnswer": 0,
        "explanation": "Scatter plots map each observation onto X and Y numeric axes to reveal correlation or clusters."
      },
      {
        "id": "dv_e3",
        "difficulty": "easy",
        "question": "Why should pie charts generally be limited to 4–5 slices or fewer?",
        "options": [
          "Humans judge angles poorly when many similarly sized slices exist",
          "Pie charts cannot display percentages",
          "Bar charts cannot represent categorical labels",
          "Pie charts require logarithmic scales"
        ],
        "correctAnswer": 0,
        "explanation": "Comparing bar lengths is far more accurate perceptually than comparing subtle slice angles."
      },
      {
        "id": "dv_h1",
        "difficulty": "hard",
        "question": "Why is a truncated non-zero baseline on a bar chart usually considered misleading?",
        "options": [
          "Bar length encodes magnitude visually, so starting at non-zero exaggerates relative differences",
          "Bar charts require logarithmic axes by default",
          "Zero baselines violate accessibility contrast rules",
          "Truncated axes hide tooltip values"
        ],
        "correctAnswer": 0,
        "explanation": "Because viewers compare bar heights proportionally, starting a bar chart at e.g. 90% makes 92% vs 94% look twice as big."
      },
      {
        "id": "dv_h2",
        "difficulty": "hard",
        "question": "When designing dashboards for color-vision accessibility, which palette practice is safest?",
        "options": [
          "Use colorblind-safe palettes paired with direct labels, patterns, or icons rather than red/green alone",
          "Encode all categories using subtle red and green shades only",
          "Remove axis labels to reduce clutter",
          "Use 15 distinct rainbow hues on every bar"
        ],
        "correctAnswer": 0,
        "explanation": "Pairing colorblind-friendly contrast (e.g., blue/amber) with icons/text ensures clarity for ~8% of men with red-green CVD."
      }
    ],
    "numpy_pandas": [
      {
        "id": "np_e1",
        "difficulty": "easy",
        "question": "Which Pandas structure represents a 2-dimensional labeled table with rows and columns?",
        "options": ["DataFrame", "Series", "ndarray", "Dictionary"],
        "correctAnswer": 0,
        "explanation": "A Pandas DataFrame stores tabular 2D data with labeled axes (index and columns)."
      },
      {
        "id": "np_e2",
        "difficulty": "easy",
        "question": "Which method shows the first 5 rows of a Pandas DataFrame `df`?",
        "options": ["df.head()", "df.top()", "df.first(5)", "df.preview()"],
        "correctAnswer": 0,
        "explanation": "`df.head()` defaults to returning the first 5 rows."
      },
      {
        "id": "np_e3",
        "difficulty": "easy",
        "question": "Why are NumPy arrays much faster than Python lists for numerical math?",
        "options": [
          "They store homogeneous data in contiguous memory and run vectorized C loops",
          "They compress floats into text",
          "They skip floating-point arithmetic",
          "They run on the browser DOM automatically"
        ],
        "correctAnswer": 0,
        "explanation": "Vectorized operations in contiguous typed memory eliminate per-element Python interpreter overhead."
      },
      {
        "id": "np_h1",
        "difficulty": "hard",
        "question": "What causes Pandas' `SettingWithCopyWarning` when filtering and assigning values like `df[df['a'] > 0]['b'] = 1`?",
        "options": [
          "Chained indexing may operate on a temporary copy rather than the original DataFrame; use `.loc[mask, 'b'] = 1`",
          "The column contains integer values instead of floats",
          "DataFrames are immutable in Pandas",
          "Boolean masks cannot filter columns"
        ],
        "correctAnswer": 0,
        "explanation": "Single-step `.loc[row_mask, col]` assignment guarantees predictable in-place mutation."
      },
      {
        "id": "np_h2",
        "difficulty": "hard",
        "question": "In NumPy broadcasting, can an array of shape (4, 3) be added to an array of shape (3,)?",
        "options": [
          "Yes — trailing dimension 3 matches and (3,) broadcasts across all 4 rows",
          "No — both arrays must have identical rank",
          "Only if converted to Python lists first",
          "Yes, resulting in shape (4, 6)"
        ],
        "correctAnswer": 0,
        "explanation": "NumPy aligns trailing axes from right to left; (3,) aligns to (1, 3) and stretches across axis 0 to (4, 3)."
      }
    ],
    "streamlit": [
      {
        "id": "st_e1",
        "difficulty": "easy",
        "question": "How does Streamlit execute your Python script when a user changes a slider or button widget?",
        "options": [
          "It reruns the Python script from top to bottom with the updated widget values",
          "It compiles Python into static C++ binaries",
          "It only executes the last line of the file",
          "It requires writing manual React hooks"
        ],
        "correctAnswer": 0,
        "explanation": "Streamlit's reactive model reruns the script top-to-bottom whenever user interaction occurs."
      },
      {
        "id": "st_e2",
        "difficulty": "easy",
        "question": "Which command runs a Streamlit app file named `app.py`?",
        "options": ["streamlit run app.py", "python -m streamlit_build", "flask run app.py", "streamlit start --port"],
        "correctAnswer": 0,
        "explanation": "`streamlit run app.py` starts the local Streamlit server and opens the app."
      },
      {
        "id": "st_e3",
        "difficulty": "easy",
        "question": "Which Streamlit object keeps variables alive across widget reruns for the same user session?",
        "options": ["st.session_state", "st.global_cache", "st.persist_var", "st.window_store"],
        "correctAnswer": 0,
        "explanation": "`st.session_state` acts like a per-session dictionary preserved across script reruns."
      },
      {
        "id": "st_h1",
        "difficulty": "hard",
        "question": "When should you choose `@st.cache_resource` instead of `@st.cache_data`?",
        "options": [
          "For non-serializable shared objects like ML models or database connections",
          "For small Pandas CSV transformations that must copy on return",
          "To save browser cookies locally",
          "To disable top-to-bottom reruns completely"
        ],
        "correctAnswer": 0,
        "explanation": "`@st.cache_resource` shares the same object instance (e.g., loaded PyTorch model), while `@st.cache_data` hashes/copies data outputs."
      },
      {
        "id": "st_h2",
        "difficulty": "hard",
        "question": "Why does nesting a second `st.button()` inside an outer `if st.button('Run'):` fail on click?",
        "options": [
          "Clicking the inner button triggers a rerun where the outer button resets to False, hiding the inner block",
          "Streamlit allows only one button per application",
          "Buttons cannot be used inside `if` statements in Python",
          "Inner buttons require async/await"
        ],
        "correctAnswer": 0,
        "explanation": "`st.button` returns True only on the single rerun of its click; use `st.session_state` to persist UI state."
      }
    ],
    "scikit_learn": [
      {
        "id": "sk_e1",
        "difficulty": "easy",
        "question": "Which Scikit-learn method trains a supervised estimator on features X and target y?",
        "options": ["model.fit(X, y)", "model.train(X, y)", "model.evaluate(X, y)", "model.transform(X, y)"],
        "correctAnswer": 0,
        "explanation": "All Scikit-learn estimators follow the uniform `.fit(X, y)` training API."
      },
      {
        "id": "sk_e2",
        "difficulty": "easy",
        "question": "What is `train_test_split` used for in Scikit-learn?",
        "options": [
          "Separating data into training and held-out evaluation subsets",
          "Deleting missing values automatically",
          "Balancing multi-class labels by oversampling",
          "Converting strings into floating point numbers"
        ],
        "correctAnswer": 0,
        "explanation": "`train_test_split` partitions arrays into training and test sets to measure generalization."
      },
      {
        "id": "sk_e3",
        "difficulty": "easy",
        "question": "Which module contains tools like StandardScaler and OneHotEncoder?",
        "options": ["sklearn.preprocessing", "sklearn.metrics", "sklearn.datasets", "sklearn.tree"],
        "correctAnswer": 0,
        "explanation": "`sklearn.preprocessing` provides scaling, normalization, and categorical encoding transformers."
      },
      {
        "id": "sk_h1",
        "difficulty": "hard",
        "question": "Why is fitting `StandardScaler()` before `train_test_split()` considered data leakage?",
        "options": [
          "Test set mean and variance leak into training feature scaling; always wrap scalers in a Pipeline fit only on train folds",
          "StandardScaler removes test rows silently",
          "It changes categorical columns to integers",
          "It forces k-fold cross-validation to shuffle labels"
        ],
        "correctAnswer": 0,
        "explanation": "Scaling on the combined dataset uses test distribution statistics; `Pipeline` ensures `.fit()` runs solely on training data."
      },
      {
        "id": "sk_h2",
        "difficulty": "hard",
        "question": "What does `ColumnTransformer` enable inside a Scikit-learn Pipeline?",
        "options": [
          "Applying distinct preprocessing steps (e.g., scaling vs one-hot encoding) to different column subsets safely",
          "Training two neural networks in parallel on GPU",
          "Replacing cross-validation with a single split",
          "Converting SQL databases directly into PNG charts"
        ],
        "correctAnswer": 0,
        "explanation": "`ColumnTransformer` routes numeric and categorical columns through separate transformers without leakage."
      }
    ],
    "machine_learning": [
      {
        "id": "ml_e1",
        "difficulty": "easy",
        "question": "What is the main difference between supervised and unsupervised learning?",
        "options": [
          "Supervised learning trains on labeled target outputs; unsupervised finds structure in unlabeled data",
          "Unsupervised learning cannot run on numeric features",
          "Supervised learning never requires train/test splits",
          "Unsupervised learning always outperforms supervised learning"
        ],
        "correctAnswer": 0,
        "explanation": "Supervised tasks (classification/regression) have known target labels y, whereas unsupervised tasks (clustering/PCA) do not."
      },
      {
        "id": "ml_e2",
        "difficulty": "easy",
        "question": "Which symptom clearly indicates a model is overfitting?",
        "options": [
          "Very high training accuracy but poor validation/test accuracy",
          "Equally poor accuracy on both training and test sets",
          "Zero loss on the test set only",
          "Fast inference speed on unseen data"
        ],
        "correctAnswer": 0,
        "explanation": "Overfitting memorizes training noise, causing strong training metrics alongside weak generalization."
      },
      {
        "id": "ml_e3",
        "difficulty": "easy",
        "question": "Which task predicts a continuous numerical price rather than a discrete category?",
        "options": ["Regression", "Binary classification", "K-means clustering", "Association rules"],
        "correctAnswer": 0,
        "explanation": "Regression models output continuous numerical targets."
      },
      {
        "id": "ml_h1",
        "difficulty": "hard",
        "question": "On a fraud dataset where 99.5% of transactions are legitimate, why is Accuracy a misleading metric?",
        "options": [
          "Predicting 'legitimate' for everything achieves 99.5% accuracy while catching 0% of fraud; use PR-AUC, F1, or Recall",
          "Accuracy cannot be computed for binary targets",
          "Imbalanced datasets always cause division by zero in accuracy",
          "Accuracy ignores true negatives"
        ],
        "correctAnswer": 0,
        "explanation": "Class imbalance makes accuracy reflect majority prevalence; Precision-Recall and F1 evaluate minority detection."
      },
      {
        "id": "ml_h2",
        "difficulty": "hard",
        "question": "How does increasing L2 regularization strength (smaller C or larger lambda) affect the bias-variance tradeoff?",
        "options": [
          "Shrinks coefficient magnitudes, reducing variance (overfitting) at the cost of higher bias",
          "Drives coefficients toward infinity to minimize training error",
          "Eliminates the need for cross-validation",
          "Increases model complexity and variance"
        ],
        "correctAnswer": 0,
        "explanation": "Stronger regularization constrains parameter magnitudes, smoothing decision boundaries and lowering variance."
      }
    ],
    "deep_learning": [
      {
        "id": "dl_e1",
        "difficulty": "easy",
        "question": "Why do neural networks place non-linear activation functions (like ReLU) between linear layers?",
        "options": [
          "Without non-linearity, stacked linear layers collapse into a single linear transformation",
          "To convert floating point weights into strings",
          "To eliminate the need for backpropagation",
          "To reduce dataset size on disk"
        ],
        "correctAnswer": 0,
        "explanation": "Non-linear activations allow multi-layer networks to approximate complex non-linear decision boundaries."
      },
      {
        "id": "dl_e2",
        "difficulty": "easy",
        "question": "Which algorithm computes gradients of the loss with respect to weights layer by layer?",
        "options": ["Backpropagation", "K-Nearest Neighbors", "Principal Component Analysis", "Min-Max Scaling"],
        "correctAnswer": 0,
        "explanation": "Backpropagation applies the chain rule backward from the loss to update every weight via gradient descent."
      },
      {
        "id": "dl_e3",
        "difficulty": "easy",
        "question": "Which neural architecture is specifically designed to capture spatial patterns in images using local filters?",
        "options": ["Convolutional Neural Network (CNN)", "Tabular Decision Tree", "Linear Regression", "TF-IDF Vectorizer"],
        "correctAnswer": 0,
        "explanation": "CNNs use sliding convolutional kernels to detect edges, textures, and higher-level spatial features."
      },
      {
        "id": "dl_h1",
        "difficulty": "hard",
        "question": "In PyTorch training loops, why must you call `optimizer.zero_grad()` before `loss.backward()` on each batch?",
        "options": [
          "PyTorch accumulates gradients into `.grad` buffers by default across backward calls",
          "It clears GPU video RAM completely after each step",
          "It freezes BatchNorm layers automatically",
          "It resets model weights back to random initialization"
        ],
        "correctAnswer": 0,
        "explanation": "Without `zero_grad()`, gradients from prior minibatches sum onto the current batch gradients."
      },
      {
        "id": "dl_h2",
        "difficulty": "hard",
        "question": "What problem do residual skip connections (`x + F(x)`) directly help solve in very deep networks?",
        "options": [
          "Vanishing gradients and degradation during deep optimization",
          "Tokenization of UTF-8 text",
          "SQL table normalization",
          "Zero-shot image resizing"
        ],
        "correctAnswer": 0,
        "explanation": "Skip connections provide an unimpeded gradient highway during backpropagation through dozens or hundreds of layers."
      }
    ],
    "html_css": [
      {
        "id": "hc_e1",
        "difficulty": "easy",
        "question": "Which CSS property turns a container into a Flexbox layout?",
        "options": ["display: flex;", "layout: flex;", "position: flex;", "align: flex;"],
        "correctAnswer": 0,
        "explanation": "Setting `display: flex;` enables Flexbox alignment on direct child items."
      },
      {
        "id": "hc_e2",
        "difficulty": "easy",
        "question": "Why should semantic tags like `<nav>`, `<main>`, and `<button>` be preferred over generic `<div>` elements?",
        "options": [
          "They provide built-in accessibility landmarks, keyboard behavior, and clear document meaning",
          "Browsers refuse to style <div> elements with CSS",
          "Semantic tags run JavaScript faster",
          "<div> tags cannot have classes"
        ],
        "correctAnswer": 0,
        "explanation": "Screen readers, keyboard navigation, and search engines rely on semantic HTML elements."
      },
      {
        "id": "hc_e3",
        "difficulty": "easy",
        "question": "Which CSS unit scales relative to the root `<html>` element's font size?",
        "options": ["rem", "px", "vh", "em"],
        "correctAnswer": 0,
        "explanation": "`rem` stands for 'root em' and stays consistent relative to the root element font size."
      },
      {
        "id": "hc_h1",
        "difficulty": "hard",
        "question": "Between `.card .title` and `#header-title`, which CSS selector wins if both set `color` on the same element?",
        "options": [
          "#header-title wins because an ID selector (0,1,0,0) has higher specificity than two classes (0,0,2,0)",
          ".card .title wins because it has two selectors",
          "Whichever appears first in the stylesheet always wins",
          "Both colors blend automatically"
        ],
        "correctAnswer": 0,
        "explanation": "ID selectors outweigh any number of class selectors in CSS specificity."
      },
      {
        "id": "hc_h2",
        "difficulty": "hard",
        "question": "In CSS Grid, what does `grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))` accomplish?",
        "options": [
          "Creates responsive columns at least 260px wide that automatically wrap and share leftover width",
          "Fixes the grid permanently to 260 columns",
          "Hides columns narrower than 260px",
          "Forces vertical scrolling inside every grid item"
        ],
        "correctAnswer": 0,
        "explanation": "`auto-fit` with `minmax(260px, 1fr)` fluidly adapts column count across screen sizes without media queries."
      }
    ],
    "typescript": [
      {
        "id": "ts_e1",
        "difficulty": "easy",
        "question": "What happens to TypeScript type annotations after compiling to JavaScript?",
        "options": [
          "They are erased and produce clean standard JavaScript",
          "They remain as runtime checks inside browsers automatically",
          "They convert JS into WebAssembly",
          "They require a special TypeScript browser engine"
        ],
        "correctAnswer": 0,
        "explanation": "TypeScript performs static type checking at compile time and strips type annotations from emitted JS."
      },
      {
        "id": "ts_e2",
        "difficulty": "easy",
        "question": "How do you mark a property `bio` as optional in a TypeScript interface `User`?",
        "options": ["bio?: string;", "bio: optional<string>;", "maybe bio: string;", "bio!: string;"],
        "correctAnswer": 0,
        "explanation": "Appending `?` after the property name marks it optional (`string | undefined`)."
      },
      {
        "id": "ts_e3",
        "difficulty": "easy",
        "question": "Which type represents an array of strings in TypeScript?",
        "options": ["string[]", "array<StringList>", "list(string)", "[string...]"],
        "correctAnswer": 0,
        "explanation": "`string[]` (or `Array<string>`) types an array of string values."
      },
      {
        "id": "ts_h1",
        "difficulty": "hard",
        "question": "Why is `unknown` safer than `any` when handling untrusted JSON API payloads?",
        "options": [
          "`unknown` forces type narrowing/validation before accessing properties, whereas `any` disables type checking",
          "`unknown` automatically parses JSON strings",
          "`any` throws a runtime exception on strings",
          "They behave identically in strict mode"
        ],
        "correctAnswer": 0,
        "explanation": "You cannot call methods or access fields on `unknown` without narrowing first, preserving type safety."
      },
      {
        "id": "ts_h2",
        "difficulty": "hard",
        "question": "What does a discriminated union (e.g. `{ kind: 'ok', data: T } | { kind: 'err', msg: string }`) provide?",
        "options": [
          "Exhaustive compile-time narrowing when switching on the literal `kind` field",
          "Automatic REST retries over HTTP",
          "Runtime garbage collection optimization",
          "Bypassing strictNullChecks"
        ],
        "correctAnswer": 0,
        "explanation": "Checking the common literal discriminant lets TypeScript narrow the remaining properties accurately in each branch."
      }
    ],
    "react": [
      {
        "id": "re_e1",
        "difficulty": "easy",
        "question": "Which React hook manages local state inside a function component?",
        "options": ["useState", "useProps", "useClass", "useDom"],
        "correctAnswer": 0,
        "explanation": "`useState` returns a stateful value and a setter function that triggers re-renders on update."
      },
      {
        "id": "re_e2",
        "difficulty": "easy",
        "question": "Why does React require a unique `key` prop when rendering a list of components?",
        "options": [
          "To identify which items changed, moved, or were removed during reconciliation",
          "To encrypt props sent over the network",
          "To sort the array alphabetically",
          "To apply CSS styles automatically"
        ],
        "correctAnswer": 0,
        "explanation": "Stable keys let React match DOM nodes accurately across renders without state mix-ups."
      },
      {
        "id": "re_e3",
        "difficulty": "easy",
        "question": "In React, how does data normally flow between parent and child components?",
        "options": ["Top-down via props", "Bottom-up via CSS variables", "Directly mutating child DOM nodes", "Global window variables only"],
        "correctAnswer": 0,
        "explanation": "React follows unidirectional data flow where parents pass props down and children invoke callback props."
      },
      {
        "id": "re_h1",
        "difficulty": "hard",
        "question": "What happens if `useEffect(() => { setCount(count + 1); })` omits a dependency array?",
        "options": [
          "It runs after every render, triggering an infinite re-render loop",
          "It runs only once on mount",
          "React skips the effect completely",
          "count stays 0 forever"
        ],
        "correctAnswer": 0,
        "explanation": "Updating state unconditionally inside an effect with no dependency array re-triggers rendering endlessly."
      },
      {
        "id": "re_h2",
        "difficulty": "hard",
        "question": "When calling `setCount(count + 1)` three times synchronously in one event handler, why might count only increase by 1?",
        "options": [
          "All three read the same closed-over `count` from that render; use functional updates `setCount(c => c + 1)`",
          "React ignores updates after the first call",
          "State updates require `async/await`",
          "Hooks only work once per second"
        ],
        "correctAnswer": 0,
        "explanation": "Functional updaters `c => c + 1` queue against the latest pending state instead of a stale render snapshot."
      }
    ],
    "nodejs_apis": [
      {
        "id": "no_e1",
        "difficulty": "easy",
        "question": "Which HTTP status code indicates a resource was successfully created on a POST request?",
        "options": ["201 Created", "404 Not Found", "401 Unauthorized", "500 Internal Server Error"],
        "correctAnswer": 0,
        "explanation": "201 Created signals successful creation of a new resource."
      },
      {
        "id": "no_e2",
        "difficulty": "easy",
        "question": "In Express.js, what does `app.use(express.json())` enable?",
        "options": [
          "Parsing incoming JSON request bodies into `req.body`",
          "Starting an HTTPS certificate authority",
          "Connecting automatically to PostgreSQL",
          "Rendering React HTML templates"
        ],
        "correctAnswer": 0,
        "explanation": "`express.json()` middleware parses `application/json` payloads before route handlers execute."
      },
      {
        "id": "no_e3",
        "difficulty": "easy",
        "question": "What is the key difference between HTTP 401 and 403?",
        "options": [
          "401 means unauthenticated (missing/invalid credentials); 403 means authenticated but lacking permission",
          "401 is a server crash; 403 is a client typo",
          "403 means URL not found",
          "They are completely interchangeable"
        ],
        "correctAnswer": 0,
        "explanation": "401 = who are you? (auth needed), 403 = I know who you are, but you are forbidden."
      },
      {
        "id": "no_h1",
        "difficulty": "hard",
        "question": "Why should CPU-heavy synchronous loops (e.g. image hashing for 5 seconds) NEVER run directly on Node's main thread?",
        "options": [
          "Node.js handles requests on a single event loop thread, so blocking CPU work stalls all concurrent users",
          "Node.js crashes whenever CPU usage exceeds 10%",
          "Synchronous loops corrupt JSON files automatically",
          "Express only supports GET requests during CPU work"
        ],
        "correctAnswer": 0,
        "explanation": "Offload CPU-bound tasks to Worker Threads or background queues so the event loop stays responsive."
      },
      {
        "id": "no_h2",
        "difficulty": "hard",
        "question": "Why is an HTTP PUT or DELETE endpoint expected to be idempotent?",
        "options": [
          "Retrying the same request due to network timeouts leaves the server state identical to a single call",
          "Idempotent endpoints never require authentication",
          "Idempotent calls bypass browser CORS checks",
          "They always return 204 No Content"
        ],
        "correctAnswer": 0,
        "explanation": "Idempotency makes API retries safe when transient network errors leave clients unsure if the first call succeeded."
      }
    ],
    "linux": [
      {
        "id": "lnx_e1",
        "difficulty": "easy",
        "question": "Which Linux command displays the current working directory path?",
        "options": ["pwd", "cd", "ls -a", "whoami"],
        "correctAnswer": 0,
        "explanation": "`pwd` stands for 'print working directory'."
      },
      {
        "id": "lnx_e2",
        "difficulty": "easy",
        "question": "Which command searches text lines inside files for a matching pattern?",
        "options": ["grep", "chmod", "mkdir", "df"],
        "correctAnswer": 0,
        "explanation": "`grep` searches files or stdin for lines matching regular expressions or strings."
      },
      {
        "id": "lnx_e3",
        "difficulty": "easy",
        "question": "What does `chmod +x deploy.sh` do?",
        "options": [
          "Adds execute permission to deploy.sh",
          "Deletes deploy.sh safely",
          "Runs deploy.sh as root immediately",
          "Compresses deploy.sh into a .gz archive"
        ],
        "correctAnswer": 0,
        "explanation": "`chmod +x` sets the executable permission bit on the script."
      },
      {
        "id": "lnx_h1",
        "difficulty": "hard",
        "question": "Why can `df -h` report a disk is 100% full even after you deleted a 50 GB log file with `rm`?",
        "options": [
          "A running process still holds an open file descriptor to the deleted file; restart/reload that process to free blocks",
          "rm moves files to /root/trash forever",
          "df -h caches disk numbers for 24 hours",
          "Linux requires rebooting after any deletion over 10 GB"
        ],
        "correctAnswer": 0,
        "explanation": "Unlinking a filename removes the directory entry, but kernel blocks remain allocated until open file descriptors close."
      },
      {
        "id": "lnx_h2",
        "difficulty": "hard",
        "question": "In shell scripting, what does `cmd1 && cmd2` guarantee compared to `cmd1 ; cmd2`?",
        "options": [
          "`cmd2` runs ONLY if `cmd1` exits with status 0 (success)",
          "`cmd1` and `cmd2` run concurrently in background subshells",
          "`cmd2` receives `cmd1`'s stderr as arguments",
          "Both commands ignore non-zero exit codes"
        ],
        "correctAnswer": 0,
        "explanation": "`&&` short-circuits on non-zero exit status, preventing later steps from running after a failure."
      }
    ],
    "docker": [
      {
        "id": "dk_e1",
        "difficulty": "easy",
        "question": "What is the relationship between a Docker image and a Docker container?",
        "options": [
          "An image is a read-only template; a container is a running instance of that image",
          "A container is stored on Docker Hub while images run in RAM",
          "Images can only contain Python code",
          "Containers are virtual machines with separate BIOS firmware"
        ],
        "correctAnswer": 0,
        "explanation": "Containers instantiate a writable runtime layer atop an immutable layered Docker image."
      },
      {
        "id": "dk_e2",
        "difficulty": "easy",
        "question": "Which file defines instructions to build a custom Docker image?",
        "options": ["Dockerfile", "docker-build.ini", "package.docker", "ContainerSpec.sql"],
        "correctAnswer": 0,
        "explanation": "A `Dockerfile` specifies FROM, COPY, RUN, and CMD/ENTRYPOINT build steps."
      },
      {
        "id": "dk_e3",
        "difficulty": "easy",
        "question": "What does `-p 8080:5000` do in `docker run -p 8080:5000 myapp`?",
        "options": [
          "Maps host port 8080 to container port 5000",
          "Maps container port 8080 to host port 5000",
          "Limits container memory to 5000 MB",
          "Runs 8080 replicas of the container"
        ],
        "correctAnswer": 0,
        "explanation": "The `-p HOST:CONTAINER` flag publishes container port 5000 on host port 8080."
      },
      {
        "id": "dk_h1",
        "difficulty": "hard",
        "question": "Why should `COPY requirements.txt .` and `RUN pip install ...` come BEFORE `COPY . .` in a Dockerfile?",
        "options": [
          "To leverage Docker build layer caching so code edits don't re-download dependencies on every build",
          "Docker refuses to copy source files before txt files",
          "pip cannot run after `COPY . .`",
          "It reduces the image's Python version size"
        ],
        "correctAnswer": 0,
        "explanation": "Invalidating an early layer invalidates all subsequent layers; placing rarely changing dependencies first speeds rebuilds."
      },
      {
        "id": "dk_h2",
        "difficulty": "hard",
        "question": "What is the key benefit of a multi-stage Dockerfile build?",
        "options": [
          "Compiles/bundles in a heavy builder stage and copies only runtime artifacts into a slim final image",
          "Runs two containers simultaneously inside one process",
          "Automatically deploys to Kubernetes without a registry",
          "Eliminates the need for `.dockerignore`"
        ],
        "correctAnswer": 0,
        "explanation": "Multi-stage builds shrink production image size and attack surface by leaving compilers/build tools behind."
      }
    ],
    "kubernetes": [
      {
        "id": "k8_e1",
        "difficulty": "easy",
        "question": "What is the smallest deployable computing unit you create and manage in Kubernetes?",
        "options": ["Pod", "Cluster", "Ingress", "ConfigMap"],
        "correctAnswer": 0,
        "explanation": "A Pod wraps one or more tightly coupled containers sharing network namespace and storage."
      },
      {
        "id": "k8_e2",
        "difficulty": "easy",
        "question": "Which Kubernetes resource exposes a stable virtual IP and DNS name across dynamic Pod replicas?",
        "options": ["Service", "Secret", "DaemonSet", "CronJob"],
        "correctAnswer": 0,
        "explanation": "A Service routes traffic via label selectors to healthy Pods even as Pod IPs change."
      },
      {
        "id": "k8_e3",
        "difficulty": "easy",
        "question": "Which CLI tool interacts with the Kubernetes API server?",
        "options": ["kubectl", "kubelet", "docker-compose", "systemctl"],
        "correctAnswer": 0,
        "explanation": "`kubectl` issues create, apply, get, describe, and logs commands to the cluster."
      },
      {
        "id": "k8_h1",
        "difficulty": "hard",
        "question": "How do Kubernetes `readinessProbe` and `livenessProbe` behave differently when failing?",
        "options": [
          "Failed readiness removes the Pod from Service endpoints; failed liveness restarts the container",
          "Failed readiness deletes the Deployment; failed liveness scales down nodes",
          "Both always restart the container immediately",
          "Readiness runs only once during image build"
        ],
        "correctAnswer": 0,
        "explanation": "Readiness protects callers from unready Pods without killing them; liveness recovers deadlocked containers."
      },
      {
        "id": "k8_h2",
        "difficulty": "hard",
        "question": "What happens if a container exceeds its memory `limits` vs its CPU `limits` in Kubernetes?",
        "options": [
          "Exceeding memory limits causes OOMKill (termination); exceeding CPU limits throttles CPU cycles",
          "Both always trigger immediate OOMKill",
          "Both only log a warning without enforcement",
          "Exceeding memory automatically scales cluster nodes"
        ],
        "correctAnswer": 0,
        "explanation": "CPU is compressible (throttled), whereas memory is incompressible and triggers Linux OOM killer on breach."
      }
    ],
    "cicd": [
      {
        "id": "ci_e1",
        "difficulty": "easy",
        "question": "What is the primary goal of Continuous Integration (CI)?",
        "options": [
          "Automatically build and test every code commit early to catch regressions fast",
          "Manually deploy zip files once a quarter",
          "Replace version control systems like Git",
          "Monitor production server temperatures"
        ],
        "correctAnswer": 0,
        "explanation": "CI automates linting, builds, and test suites on every push or pull request."
      },
      {
        "id": "ci_e2",
        "difficulty": "easy",
        "question": "In GitHub Actions, where are workflow YAML definitions stored inside a repository?",
        "options": [".github/workflows/", "ci/actions.json", "src/pipelines/", ".git/hooks/"],
        "correctAnswer": 0,
        "explanation": "GitHub Actions detects workflow YAML files inside `.github/workflows/`."
      },
      {
        "id": "ci_e3",
        "difficulty": "easy",
        "question": "How should API keys or deployment tokens be stored for CI/CD pipelines?",
        "options": [
          "In encrypted CI/CD Secrets / Vaults injected as environment variables",
          "Hardcoded directly in the workflow YAML",
          "Committed in README.md for team convenience",
          "Passed as URL query strings in HTML"
        ],
        "correctAnswer": 0,
        "explanation": "Encrypted secret managers mask credentials in logs and avoid exposing keys in Git history."
      },
      {
        "id": "ci_h1",
        "difficulty": "hard",
        "question": "How does a blue-green deployment strategy minimize release risk?",
        "options": [
          "Runs identical current (blue) and new (green) environments and switches router traffic only after health checks pass",
          "Deploys untested code straight to half of production databases with no rollback",
          "Shuts down production for 1 hour during database migrations",
          "Splits CI runners across two Git branches permanently"
        ],
        "correctAnswer": 0,
        "explanation": "Blue-green enables zero-downtime cutover and instant rollback by flipping traffic back to blue."
      },
      {
        "id": "ci_h2",
        "difficulty": "hard",
        "question": "Why should pull-request workflows from untrusted forks avoid running `pull_request_target` with checked-out PR code and secrets?",
        "options": [
          "Untrusted PR scripts could execute with write tokens and repository secrets",
          "pull_request_target disables unit tests automatically",
          "GitHub Actions rejects YAML files on forks",
          "It doubles build minutes billing"
        ],
        "correctAnswer": 0,
        "explanation": "`pull_request_target` runs in the base repo's privileged context; checking out untrusted fork code enables secret exfiltration."
      }
    ],
    "terraform": [
      {
        "id": "tf_e1",
        "difficulty": "easy",
        "question": "Which Terraform command previews infrastructure changes WITHOUT applying them?",
        "options": ["terraform plan", "terraform apply", "terraform destroy", "terraform fmt"],
        "correctAnswer": 0,
        "explanation": "`terraform plan` compares desired HCL configuration against state and outputs an execution plan."
      },
      {
        "id": "tf_e2",
        "difficulty": "easy",
        "question": "What does `terraform init` do in a new Terraform working directory?",
        "options": [
          "Downloads required provider plugins and initializes the backend",
          "Deletes all cloud virtual machines",
          "Starts a Kubernetes cluster automatically",
          "Compiles HCL into Python"
        ],
        "correctAnswer": 0,
        "explanation": "`terraform init` prepares providers, modules, and state backend configuration."
      },
      {
        "id": "tf_e3",
        "difficulty": "easy",
        "question": "Why is Terraform called an Infrastructure as Code (IaC) tool?",
        "options": [
          "Cloud resources are declared in versioned configuration files for repeatable provisioning",
          "It replaces application code in React",
          "It generates HTML dashboards automatically",
          "It monitors CPU usage inside Linux"
        ],
        "correctAnswer": 0,
        "explanation": "Declarative IaC allows infrastructure changes to be code-reviewed, tracked in Git, and reproduced reliably."
      },
      {
        "id": "tf_h1",
        "difficulty": "hard",
        "question": "Why should production teams store `terraform.tfstate` in a remote backend (like S3 + DynamoDB / GCS) with locking?",
        "options": [
          "Prevents concurrent applies from corrupting shared state and avoids committing sensitive state values to Git",
          "Remote backends allow skipping `terraform init`",
          "Local state files cannot track AWS resources",
          "State locking auto-upgrades provider versions"
        ],
        "correctAnswer": 0,
        "explanation": "State locking ensures only one apply mutates infrastructure at a time and keeps secrets out of source control."
      },
      {
        "id": "tf_h2",
        "difficulty": "hard",
        "question": "What happens if an administrator manually modifies an AWS security group in the console that Terraform manages?",
        "options": [
          "Configuration drift occurs and the next `terraform plan` detects changes needed to reconcile back to HCL",
          "Terraform automatically updates local `.tf` files",
          "AWS locks the account permanently",
          "Terraform deletes the entire VPC immediately"
        ],
        "correctAnswer": 0,
        "explanation": "Refreshing state reveals drift so Terraform can revert manual out-of-band edits or bring them into code."
      }
    ],
    "aws_cloud": [
      {
        "id": "aws_e1",
        "difficulty": "easy",
        "question": "Which AWS service manages users, roles, groups, and fine-grained access permissions?",
        "options": ["IAM", "S3", "EC2", "Route 53"],
        "correctAnswer": 0,
        "explanation": "AWS Identity and Access Management (IAM) controls authentication and authorization."
      },
      {
        "id": "aws_e2",
        "difficulty": "easy",
        "question": "Which AWS service provides durable object storage for files, backups, and static assets?",
        "options": ["Amazon S3", "Amazon RDS", "AWS Lambda", "Amazon VPC"],
        "correctAnswer": 0,
        "explanation": "Simple Storage Service (S3) stores objects in buckets with high durability."
      },
      {
        "id": "aws_e3",
        "difficulty": "easy",
        "question": "What does the Principle of Least Privilege recommend when assigning IAM permissions?",
        "options": [
          "Grant only the minimum permissions required to perform a task",
          "Give AdministratorAccess to every service for speed",
          "Share root account keys with all developers",
          "Disable MFA on production roles"
        ],
        "correctAnswer": 0,
        "explanation": "Least privilege minimizes blast radius if an identity or instance credential is compromised."
      },
      {
        "id": "aws_h1",
        "difficulty": "hard",
        "question": "Why should EC2 instances access S3 using an attached IAM Role rather than storing access keys in `.env` files?",
        "options": [
          "IAM Roles issue short-lived temporary credentials automatically rotated via instance metadata",
          "S3 rejects all requests made with IAM access keys",
          "IAM Roles double S3 network bandwidth",
          "Access keys expire permanently after 5 minutes"
        ],
        "correctAnswer": 0,
        "explanation": "Temporary STS tokens from IAM instance profiles avoid long-lived static secrets leaking on disk or in repos."
      },
      {
        "id": "aws_h2",
        "difficulty": "hard",
        "question": "In an AWS VPC, how do Security Groups differ from Network ACLs (NACLs)?",
        "options": [
          "Security Groups are stateful at the instance/ENI level; NACLs are stateless at the subnet level",
          "NACLs support only outbound rules",
          "Security Groups require explicit deny rules for every port",
          "Both are stateless and apply only to S3"
        ],
        "correctAnswer": 0,
        "explanation": "Stateful Security Groups automatically permit return traffic for allowed requests, while stateless NACLs check both directions."
      }
    ],
    "networking": [
      {
        "id": "net_e1",
        "difficulty": "easy",
        "question": "What is the primary role of DNS (Domain Name System)?",
        "options": [
          "Translating human-readable domain names (like example.com) into IP addresses",
          "Encrypting files stored on hard drives",
          "Assigning MAC addresses to network cards",
          "Compiling HTML pages in browsers"
        ],
        "correctAnswer": 0,
        "explanation": "DNS resolves hostnames to IPv4/IPv6 addresses and service records."
      },
      {
        "id": "net_e2",
        "difficulty": "easy",
        "question": "Which standard TCP port does HTTPS traffic use by default?",
        "options": ["443", "80", "22", "53"],
        "correctAnswer": 0,
        "explanation": "HTTPS uses port 443 (while plain HTTP uses 80, SSH uses 22, and DNS uses 53)."
      },
      {
        "id": "net_e3",
        "difficulty": "easy",
        "question": "How does TCP differ from UDP?",
        "options": [
          "TCP provides reliable ordered delivery with handshakes and retransmissions; UDP is connectionless and lower-overhead",
          "UDP guarantees packet order while TCP drops packets",
          "TCP works only over Wi-Fi",
          "UDP requires TLS encryption by default"
        ],
        "correctAnswer": 0,
        "explanation": "TCP ensures reliable byte streams; UDP trades reliability for minimal latency (used in DNS, streaming, gaming)."
      },
      {
        "id": "net_h1",
        "difficulty": "hard",
        "question": "How many usable host IPv4 addresses are available inside a `/26` subnet?",
        "options": ["62", "64", "30", "126"],
        "correctAnswer": 0,
        "explanation": "A /26 leaves 6 host bits (2^6 = 64 total addresses); subtracting network and broadcast leaves 62 usable hosts."
      },
      {
        "id": "net_h2",
        "difficulty": "hard",
        "question": "During a TLS 1.3 handshake, what ensures forward secrecy even if the server's private certificate key is leaked years later?",
        "options": [
          "Ephemeral Diffie-Hellman (ECDHE) key exchange creates unique per-session keys never derived solely from the static key",
          "Using MD5 hashes on HTTP headers",
          "Caching the certificate inside DNS TXT records",
          "Disabling certificate verification on clients"
        ],
        "correctAnswer": 0,
        "explanation": "With ECDHE, past recorded ciphertext cannot be decrypted using a later-compromised long-term signing key."
      }
    ],
    "security_basics": [
      {
        "id": "sec_e1",
        "difficulty": "easy",
        "question": "What do the three letters in the CIA security triad stand for?",
        "options": [
          "Confidentiality, Integrity, Availability",
          "Compliance, Identity, Auditing",
          "Cryptography, Intrusion, Authentication",
          "Control, Isolation, Access"
        ],
        "correctAnswer": 0,
        "explanation": "Confidentiality protects secrecy, Integrity prevents unauthorized tampering, and Availability ensures uptime."
      },
      {
        "id": "sec_e2",
        "difficulty": "easy",
        "question": "Why should user passwords be stored using slow salted hashes (like Argon2 or bcrypt) instead of encryption or plain SHA-256?",
        "options": [
          "Salted slow hashes cannot be decrypted and resist rainbow tables and brute-force GPU cracking",
          "Passwords must be recoverable in plaintext by admins",
          "SHA-256 is an encryption algorithm with a secret key",
          "bcrypt shortens all passwords to 4 characters"
        ],
        "correctAnswer": 0,
        "explanation": "Unique per-user salts defeat precomputed rainbow tables, and memory-hard slowness thwarts brute force."
      },
      {
        "id": "sec_e3",
        "difficulty": "easy",
        "question": "What does MFA (Multi-Factor Authentication) require?",
        "options": [
          "Two or more independent verification factors (e.g. password + authenticator code/hardware key)",
          "Typing the same password twice",
          "Using an 8-character lowercase password",
          "Disabling HTTPS on login forms"
        ],
        "correctAnswer": 0,
        "explanation": "Combining knowledge (password) with possession (hardware token/TOTP) or inherence stops credential-only breaches."
      },
      {
        "id": "sec_h1",
        "difficulty": "hard",
        "question": "Why do parameterized SQL queries (prepared statements) prevent SQL injection?",
        "options": [
          "The database compiles the SQL structure first and treats bound parameters strictly as literal data, never executable code",
          "They automatically strip all vowels from user strings",
          "They encrypt the database table names in RAM",
          "They force queries to run client-side"
        ],
        "correctAnswer": 0,
        "explanation": "Separating code syntax from data inputs ensures quotes or keywords in user input cannot alter query logic."
      },
      {
        "id": "sec_h2",
        "difficulty": "hard",
        "question": "Which combination best defends against BOTH XSS and CSRF on a cookie-authenticated web app?",
        "options": [
          "Strict output escaping / CSP for XSS, plus SameSite cookies and CSRF tokens for state-changing requests",
          "Base64-encoding usernames in localStorage",
          "Disabling CORS completely on static CSS files",
          "Using HTTP GET for delete operations"
        ],
        "correctAnswer": 0,
        "explanation": "Output escaping/CSP blocks injected scripts (XSS), while SameSite + unpredictable CSRF tokens block forged cross-site requests."
      }
    ],
    "ethical_hacking": [
      {
        "id": "eh_e1",
        "difficulty": "easy",
        "question": "What MUST happen before any authorized penetration test begins?",
        "options": [
          "Written scope authorization and Rules of Engagement signed by the system owner",
          "Exploiting external partner servers to test reachability",
          "Publishing zero-day findings on social media",
          "Deleting production backups"
        ],
        "correctAnswer": 0,
        "explanation": "Explicit written authorization and clearly bounded scope separate ethical testing from illegal intrusion."
      },
      {
        "id": "eh_e2",
        "difficulty": "easy",
        "question": "Which tool is widely used for network port discovery and service enumeration?",
        "options": ["Nmap", "Power BI", "Prettier", "Pandas"],
        "correctAnswer": 0,
        "explanation": "Nmap probes hosts, open ports, service versions, and OS fingerprints."
      },
      {
        "id": "eh_e3",
        "difficulty": "easy",
        "question": "What does an IDOR (Insecure Direct Object Reference) vulnerability allow?",
        "options": [
          "Accessing another user's records by changing an ID parameter due to missing server-side authorization checks",
          "Crashing CSS grid layouts",
          "Bypassing TLS certificates via DNS",
          "Compressing images inside emails"
        ],
        "correctAnswer": 0,
        "explanation": "IDOR occurs when endpoints check authentication (logged in) without verifying object-level ownership."
      },
      {
        "id": "eh_h1",
        "difficulty": "hard",
        "question": "How does SSRF (Server-Side Request Forgery) become critical in cloud environments?",
        "options": [
          "An attacker tricks the backend into fetching internal endpoints like `169.254.169.254` to steal cloud IAM role credentials",
          "SSRF leaks browser CSS stylesheets",
          "SSRF converts SQL queries into Python",
          "SSRF only affects offline desktop apps"
        ],
        "correctAnswer": 0,
        "explanation": "Unvalidated server-side URL fetches can reach internal metadata services unless blocked with IMDSv2 and allowlists."
      },
      {
        "id": "eh_h2",
        "difficulty": "hard",
        "question": "In Nmap, why is a SYN scan (`-sS`) called 'half-open'?",
        "options": [
          "It sends SYN and inspects SYN-ACK/RST, then sends RST without completing the full 3-way TCP handshake",
          "It only scans even-numbered ports",
          "It uses UDP packets instead of TCP",
          "It keeps every port open indefinitely"
        ],
        "correctAnswer": 0,
        "explanation": "Tearing down with RST after SYN-ACK avoids opening full application connections, reducing log noise and latency."
      }
    ],
    "siem_monitoring": [
      {
        "id": "siem_e1",
        "difficulty": "easy",
        "question": "What does SIEM stand for in cybersecurity operations?",
        "options": [
          "Security Information and Event Management",
          "System Internet Encryption Module",
          "Server Identity Evaluation Monitor",
          "Software Integrity Error Map"
        ],
        "correctAnswer": 0,
        "explanation": "SIEM platforms centralize security logs, correlate events, and alert SOC analysts to threats."
      },
      {
        "id": "siem_e2",
        "difficulty": "easy",
        "question": "What is an IOC (Indicator of Compromise) during threat hunting?",
        "options": [
          "Forensic evidence of intrusion such as malicious IPs, file hashes, or suspicious domain queries",
          "A routine OS software update notification",
          "An employee vacation calendar entry",
          "A passing unit test result"
        ],
        "correctAnswer": 0,
        "explanation": "IOCs help analysts detect and match known attacker artifacts across logs and endpoints."
      },
      {
        "id": "siem_e3",
        "difficulty": "easy",
        "question": "Why is centralized log shipping important for incident investigation?",
        "options": [
          "Attackers often wipe local host logs, and central aggregation enables cross-system timeline correlation",
          "It disables firewall rules automatically",
          "It deletes logs older than 5 minutes",
          "It replaces multi-factor authentication"
        ],
        "correctAnswer": 0,
        "explanation": "Tamper-resistant central logs preserve forensic timelines across endpoints, identity providers, and firewalls."
      },
      {
        "id": "siem_h1",
        "difficulty": "hard",
        "question": "Why is log time synchronization (NTP/UTC) critical when correlating alerts in a SIEM?",
        "options": [
          "Clock skew across servers scrambles attack sequence reconstruction and breaks time-window correlation rules",
          "SIEM databases refuse integer timestamps",
          "UTC eliminates the need for IP logging",
          "NTP encrypts syslog packets automatically"
        ],
        "correctAnswer": 0,
        "explanation": "Accurate UTC timestamps ensure lateral movement across hosts and cloud logs aligns reliably in order."
      },
      {
        "id": "siem_h2",
        "difficulty": "hard",
        "question": "How can SOC teams reduce alert fatigue from noisy SIEM correlation rules without missing real attacks?",
        "options": [
          "Tune thresholds using baseline context, enrich with asset criticality/identity risk, and chain multi-signal detections",
          "Disable all medium and high severity alerts",
          "Stop collecting firewall and authentication logs",
          "Trigger alerts only once per month"
        ],
        "correctAnswer": 0,
        "explanation": "Risk-based alerting and contextual enrichment filter benign anomalies while elevating true multi-stage threats."
      }
    ]
  };
  /* QUESTION_BANK_JSON_END */

  function getQuestionsForSkill(skillId) {
    const list = QUESTION_BANK[skillId] || [];
    return list.map((q) => ({
      ...q,
      options: q.options.slice(),
    }));
  }

  function hasQuestions(skillId) {
    return Array.isArray(QUESTION_BANK[skillId]) && QUESTION_BANK[skillId].length === 5;
  }

  return {
    QUESTION_BANK,
    getQuestionsForSkill,
    hasQuestions,
  };
})();
