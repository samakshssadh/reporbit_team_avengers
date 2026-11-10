import { LearningPath } from "../types";

// Reporbit Python course (Python 3.14 or newer).
// Six stages, from first program to first open-source contribution.
// Every stage: what it teaches, what you can do after it, modules with topics,
// a project, resources and a short quiz that unlocks "complete".

const DOCS = "https://docs.python.org/3";
const CS50P_SITE = { title: "Harvard CS50P: Introduction to Programming with Python", domain: "cs50.harvard.edu", url: "https://cs50.harvard.edu/python/", description: "Free Harvard course with lectures, problem sets and a free certificate.", type: "Interactive Tutorial" as const };
const PYTUTOR = { title: "Python Tutor: watch your code run", domain: "pythontutor.com", url: "https://pythontutor.com/", description: "Paste code and step through it line by line to see variables change.", type: "Interactive Tutorial" as const };
const CS50P_VIDEOS = { id: "py-cs50p", title: "CS50P lectures (full playlist)", channel: "CS50 / Harvard", duration: "~16 hours", url: "https://www.youtube.com/playlist?list=PLhQjrBD2T3817j24-GogXmWqO5Q5vYy0V", level: "Beginner" };
const FCC_PYTHON = { id: "py-fcc", title: "Learn Python: Full Course for Beginners", channel: "freeCodeCamp.org", duration: "~4.5 hours", url: "https://www.youtube.com/watch?v=rfscVS0vtbw", level: "Beginner" };

export const PYTHON_COURSE: LearningPath = {
  subject: "Python",
  title: "Python: from your first program to your first open-source contribution",
  tagline: "Python 3.14 or newer. Six stages: setup, fundamentals, functions, object-oriented design, data science and contributor skills.",
  description: "A complete, balanced Python course. Each module takes 30 to 60 minutes. Every stage ends with a project and a short quiz.",
  level: "Absolute beginner → Contributor-ready · about 10–14 weeks at 5–7 hours a week",
  prerequisites: ["A computer with internet", "No coding experience needed"],
  stages: [
    // ───────────────────────── Stage 0 ─────────────────────────
    {
      id: "pyc-s0",
      stageNumber: 0,
      title: "Getting set up",
      summary: "Install Python and VS Code, run your first program and learn to read error messages.",
      description: "How to install Python, write and run your first program, and read error messages, so nothing technical blocks you later.",
      youCanNow: "run Python code in the shell and from a file, and understand what an error message is telling you.",
      estimatedHours: "1–2 days",
      concepts: ["Installing Python 3.14+", "VS Code", "The Python shell (REPL)", "Running a .py file", "Reading errors"],
      keyTakeaways: [
        "Check your install with `python --version` (or `python3 --version` on Mac/Linux).",
        "The shell is for quick experiments; files are for programs you want to keep.",
        "Read an error from the bottom up: the last line says what went wrong, the lines above say where.",
      ],
      modules: [
        { id: "py-0-1", title: "Install Python and VS Code", topics: ["Download Python 3.14 or newer from python.org", "Windows: tick “Add python.exe to PATH”", "Install VS Code and the Python extension", "Check: `python --version`"] },
        { id: "py-0-2", title: "The shell vs a file", topics: ["Open the shell by typing `python`", "Python 3.14's shell has colours and autocomplete", "Create `hello.py` and run it with `python hello.py`", "Exit the shell with `exit()`"] },
        { id: "py-0-3", title: "Reading an error message", topics: ["What a traceback is", "Line numbers and the arrow `^`", "Python 3.14's “Did you mean…?” hints", "Copy the last line into a search engine or ask Orbit AI"] },
      ],
      project: "Write `hello.py` that prints your name and your favourite food, then break it on purpose (remove a quote) and read the error.",
      quiz: [
        { q: "Which command checks that Python is installed?", options: ["python --version", "python install", "run python"], answer: 0, why: "`python --version` prints the installed version, e.g. Python 3.14.0." },
        { q: "Where should you look first in an error message?", options: ["The first line", "The last line", "The middle"], answer: 1, why: "The last line names the error type and what went wrong." },
        { q: "What is the shell (REPL) best for?", options: ["Saving big programs", "Quick experiments", "Installing packages"], answer: 1, why: "The shell runs one line at a time, perfect for trying things out." },
      ],
      videos: [FCC_PYTHON],
      websites: [
        { title: "Download Python", domain: "python.org", url: "https://www.python.org/downloads/", description: "Official installers for Windows, Mac and Linux.", type: "Official Docs" },
        { title: "Using Python on Windows / Mac", domain: "docs.python.org", url: `${DOCS}/using/index.html`, description: "Official setup guide for each operating system.", type: "Official Docs" },
        PYTUTOR,
      ],
    },

    // ───────────────────────── Stage 1 ─────────────────────────
    {
      id: "pyc-s1",
      stageNumber: 1,
      title: "Python fundamentals",
      summary: "Output and input, data types, operators, strings, conditions, loops, lists, tuples, sets, dictionaries and the built-in functions.",
      description: "The building blocks of every Python program: showing output, taking input, storing data, making decisions and repeating actions.",
      youCanNow: "write small programs that talk to the user, do calculations and work with lists of data.",
      estimatedHours: "2–3 weeks",
      concepts: ["print() and input()", "Data types", "Operators", "Strings", "if / elif / else", "Loops", "Lists, tuples, sets, dicts", "Built-in functions"],
      keyTakeaways: [
        "`input()` always gives you text: convert it with `int()` or `float()` before doing maths.",
        "Indentation is part of Python's grammar: 4 spaces per level.",
        "Lists change, tuples don't: pick tuples for fixed data like coordinates.",
        "Use a dictionary when you look things up by name (key), a list when order matters.",
      ],
      modules: [
        { id: "py-1-1", title: "1.1 Output and input", topics: ["`print()` with several values, `sep=` and `end=`", "`input()` returns text", "Converting with `int()`, `float()`, `str()`", "Comments with `#`"], tryIt: "Ask for the user's name and birth year, then print their age." },
        { id: "py-1-2", title: "1.2 Variables and data types", topics: ["Naming rules and snake_case", "`int`, `float`, `bool`, `str`, `None` (and `complex`)", "`type()` and `isinstance()`", "Constants by convention: `MAX_SIZE = 10`"], tryIt: "Store a price, quantity and in-stock flag; print each with its type." },
        { id: "py-1-3", title: "1.3 Operators", topics: ["Arithmetic `+ - * /`, floor division `//`, remainder `%`, power `**`", "Comparison `== != < > <= >=`", "Logical `and`, `or`, `not`", "Assignment shortcuts `+= -= *=`", "Membership `in` and identity `is` (`is` is not `==`)", "Precedence and brackets", "Why `0.1 + 0.2` isn't exactly `0.3`"], tryIt: "Check whether a number is even with `%`." },
        { id: "py-1-4", title: "1.4 Strings", topics: ["Quotes, triple quotes, `\\n` and `\\t`", "Indexing and slicing: `s[0]`, `s[-1]`, `s[1:4]`, `s[::-1]`", "Methods: `upper lower title strip split join replace find count startswith endswith isdigit isalpha`", "f-strings: `f\"{price:.2f}\"`, padding, `{n:,}`", "Strings can't be changed in place"], tryIt: "Turn “  hello world ” into “Hello World” and count the letter o." },
        { id: "py-1-5", title: "1.5 Conditions", topics: ["`if`, `elif`, `else` and indentation", "Truthy and falsy values: `0`, `\"\"`, `[]`, `None`", "Nested conditions; `and` / `or`", "One-line `x if cond else y`", "`match` / `case` basics"], tryIt: "Grade calculator: 90+ A, 80+ B, 70+ C, otherwise D." },
        { id: "py-1-6", title: "1.6 Loops", topics: ["`while` loops and avoiding infinite loops", "`for` loops with `range(start, stop, step)`", "`break`, `continue`, and `else` on loops", "`enumerate()` and `zip()`", "Patterns: counting, summing, finding the biggest"], tryIt: "Print the multiplication table of any number the user enters." },
        { id: "py-1-7", title: "1.7 Lists, tuples, sets and dictionaries", topics: ["Lists: `append extend insert remove pop index count sort reverse copy`, `sorted()`", "Tuples and unpacking: `a, b = b, a`", "Sets: unique items, `|` union, `&` intersection, `-` difference", "Dicts: `get keys values items update pop setdefault`", "Mutable vs immutable; two names pointing at one list", "Which one to use when"], tryIt: "Store 3 students' marks in a dict and print the top scorer." },
        { id: "py-1-8", title: "1.8 Built-in functions you must know", topics: ["See the cheat sheet below: every function with a one-line example"], tryIt: "Use `sum`, `max` and `sorted` on a list of 5 numbers." },
        { id: "py-1-9", title: "1.9 Errors you will meet", topics: ["Read tracebacks bottom-up", "`SyntaxError`, `IndentationError`, `NameError`, `TypeError`, `ValueError`, `IndexError`, `KeyError`, `ZeroDivisionError`", "A first `try` / `except` for bad input"], tryIt: "Keep asking for a number until the user types a valid one." },
      ],
      project: "Build three small programs: a number-guessing game, a calculator with a menu, and a student-grades report that prints the average, highest and lowest mark.",
      quiz: [
        { q: "What does `input()` return?", options: ["A number", "Text (str)", "It depends on what you type"], answer: 1, why: "`input()` always returns a string; convert it with `int()` or `float()`." },
        { q: "What is `7 // 2`?", options: ["3.5", "3", "1"], answer: 1, why: "`//` is floor division: it drops the decimal part. `7 % 2` would be 1." },
        { q: "Which collection keeps only unique items?", options: ["list", "tuple", "set"], answer: 2, why: "A set removes duplicates automatically." },
      ],
      videos: [FCC_PYTHON, CS50P_VIDEOS],
      websites: [
        CS50P_SITE,
        { title: "Official tutorial: An informal introduction", domain: "docs.python.org", url: `${DOCS}/tutorial/introduction.html`, description: "Numbers, text and lists, explained by the Python team.", type: "Official Docs" },
        { title: "Official tutorial: Control flow", domain: "docs.python.org", url: `${DOCS}/tutorial/controlflow.html`, description: "if, for, range, break, continue, match.", type: "Official Docs" },
        { title: "Official tutorial: Data structures", domain: "docs.python.org", url: `${DOCS}/tutorial/datastructures.html`, description: "Lists, tuples, sets and dictionaries in depth.", type: "Official Docs" },
        { title: "Built-in functions reference", domain: "docs.python.org", url: `${DOCS}/library/functions.html`, description: "Every built-in function, with details.", type: "Cheat Sheet" },
        PYTUTOR,
      ],
    },

    // ───────────────────────── Stage 2 ─────────────────────────
    {
      id: "pyc-s2",
      stageNumber: 2,
      title: "Functions, recursion and problem solving",
      summary: "Functions in depth, recursion, comprehensions, errors, files, the standard library, packages and debugging.",
      description: "How to organise code into reusable pieces, think through problems step by step and use Python's standard library. This is the foundation for object-oriented design.",
      youCanNow: "build a small multi-file program that saves its data and handles mistakes gracefully.",
      estimatedHours: "2–3 weeks",
      concepts: ["def / return", "*args and **kwargs", "Scope", "Recursion", "Comprehensions", "Generators", "try / except / finally", "Files, CSV, JSON", "Modules and pip", "Debugging"],
      keyTakeaways: [
        "A function should do one thing, and its name should say what.",
        "Every recursive function needs a base case that stops it.",
        "Catch specific errors (`except ValueError`), never a bare `except:`.",
        "Always open files with `with open(...)`, so they close automatically.",
      ],
      modules: [
        { id: "py-2-1", title: "2.1 Functions in depth", topics: ["`def`, parameters and `return`; returning several values", "Default values and keyword arguments", "`*args` and `**kwargs`", "Scope: local vs global, `global` / `nonlocal` (and why to avoid them)", "Docstrings and type hints: `def area(r: float) -> float:`", "`lambda`, `map`, `filter`, `sorted(key=…)`"], tryIt: "Write `average(*numbers)` that works with any number of values." },
        { id: "py-2-2", title: "2.2 Recursion", topics: ["Base case + a smaller problem", "Factorial, Fibonacci, sum of a list, reversing a string", "Folders inside folders", "The recursion limit and `RecursionError`", "Recursion vs loops"], tryIt: "Write a recursive `countdown(n)`." },
        { id: "py-2-3", title: "2.3 Comprehensions, iterators and handy tools", topics: ["List, dict and set comprehensions (and when not to use them)", "Generator expressions and `yield`", "`collections`: `Counter`, `defaultdict`, `deque`, `namedtuple`", "Highlights of `itertools` and `functools`"], tryIt: "Count word frequencies with `Counter`." },
        { id: "py-2-4", title: "2.4 Handling errors properly", topics: ["`try`, `except`, `else`, `finally`", "Catching specific errors", "`raise` and custom exception classes"], tryIt: "Raise `ValueError` when an age is negative." },
        { id: "py-2-5", title: "2.5 Files and data formats", topics: ["`with open(...)`: read and write text", "`pathlib.Path` for file paths", "The `csv` and `json` modules"], tryIt: "Save a list of tasks to `tasks.json` and load it back." },
        { id: "py-2-6", title: "2.6 Modules, packages and the standard library", topics: ["`import`, `from … import`, `as`", "Your own modules; `if __name__ == \"__main__\":`", "Tour: `math random datetime time os sys pathlib json csv re statistics`", "`pip`, virtual environments (`python -m venv .venv`), `requirements.txt`"], tryIt: "Split your project into `main.py` and `helpers.py`." },
        { id: "py-2-7", title: "2.7 Problem solving and debugging", topics: ["Break problems down; write pseudocode first", "Linear vs binary search; sorting ideas", "“How fast is my code?” (Big-O in plain words)", "`print` debugging, `breakpoint()` and the VS Code debugger"], tryIt: "Step through a buggy loop in the VS Code debugger." },
      ],
      project: "A command-line to-do app (add, list, complete, delete) that saves to a JSON file, plus a word-frequency counter for any text file.",
      quiz: [
        { q: "What must every recursive function have?", options: ["A loop", "A base case", "A global variable"], answer: 1, why: "Without a base case the function calls itself forever and raises RecursionError." },
        { q: "Why use `with open(...)`?", options: ["It's faster", "It closes the file automatically", "It reads binary files only"], answer: 1, why: "`with` makes sure the file is closed, even if an error happens." },
        { q: "What does `[x * 2 for x in range(3)]` give?", options: ["[0, 2, 4]", "[2, 4, 6]", "[0, 1, 2]"], answer: 0, why: "range(3) is 0, 1, 2; each is doubled." },
      ],
      videos: [CS50P_VIDEOS],
      websites: [
        CS50P_SITE,
        { title: "Official tutorial: Defining functions", domain: "docs.python.org", url: `${DOCS}/tutorial/controlflow.html#defining-functions`, description: "Functions, defaults, keyword arguments, *args, lambda.", type: "Official Docs" },
        { title: "Official tutorial: Errors and exceptions", domain: "docs.python.org", url: `${DOCS}/tutorial/errors.html`, description: "try, except, else, finally, raise.", type: "Official Docs" },
        { title: "Official tutorial: Input and output", domain: "docs.python.org", url: `${DOCS}/tutorial/inputoutput.html`, description: "Formatting output, reading and writing files, JSON.", type: "Official Docs" },
        { title: "Official tutorial: Modules", domain: "docs.python.org", url: `${DOCS}/tutorial/modules.html`, description: "Importing, packages and `__main__`.", type: "Official Docs" },
        { title: "Official tutorial: Virtual environments and packages", domain: "docs.python.org", url: `${DOCS}/tutorial/venv.html`, description: "venv and pip, step by step.", type: "Guide" },
      ],
    },

    // ───────────────────────── Stage 3 ─────────────────────────
    {
      id: "pyc-s3",
      stageNumber: 3,
      title: "Object-oriented design and data modelling",
      summary: "Classes and objects, the four pillars, special methods, dataclasses, Enum, type hints, Pydantic and testing.",
      description: "How to model real things (users, repositories, orders) as objects, design clean programs and describe data precisely. Most open-source Python projects use these ideas.",
      youCanNow: "read and extend class-based code in a real project, and design your own data models.",
      estimatedHours: "2–3 weeks",
      concepts: ["Classes and objects", "Encapsulation", "Inheritance", "Polymorphism", "Abstraction", "Dunder methods", "dataclasses", "Enum", "Type hints", "Pydantic", "pytest"],
      keyTakeaways: [
        "A class is a blueprint; an object is one thing built from it.",
        "Prefer composition (has-a) over inheritance (is-a) unless the relationship is truly “is a”.",
        "`@dataclass` removes boilerplate for classes that mainly hold data.",
        "Validate data at the edges of your program (with Pydantic), then trust it inside.",
      ],
      modules: [
        { id: "py-3-1", title: "3.1 Classes and objects", topics: ["`class`, `__init__`, attributes, methods, `self`", "Class attributes vs instance attributes", "`@classmethod` and `@staticmethod`"], tryIt: "Create a `BankAccount` with `deposit` and `withdraw`." },
        { id: "py-3-2", title: "3.2 The four pillars, in plain words", topics: ["Encapsulation: `_private` by convention, `@property`", "Inheritance: subclasses, `super()`, overriding", "Polymorphism and duck typing", "Abstraction: abstract base classes (`abc`)", "Composition vs inheritance"], tryIt: "Make `SavingsAccount` inherit from `BankAccount` and add interest." },
        { id: "py-3-3", title: "3.3 Special (dunder) methods", topics: ["`__str__` and `__repr__`", "`__eq__`, `__lt__` (sorting your objects)", "`__len__`, `__iter__`, `__getitem__`, `__contains__`", "Context managers: `__enter__` / `__exit__`"], tryIt: "Make a `Playlist` that works with `len()` and `for` loops." },
        { id: "py-3-4", title: "3.4 Data modelling", topics: ["`@dataclass`: fields, defaults, `frozen=True`, `order=True`", "`Enum` for fixed choices (open, closed, merged)", "Type hints: `list[str]`, `dict[str, int]`, `X | None`, `TypedDict`, `Protocol`", "Pydantic models and validation errors; loading JSON", "Designing models: find the nouns, one-to-many relationships", "Principles: single responsibility, don't repeat yourself, keep it simple"], tryIt: "Model an Issue with a status Enum and a list of labels." },
        { id: "py-3-5", title: "3.5 Testing your classes", topics: ["Install `pytest`", "Write `test_*.py` files and `assert`", "Run tests and read a failure"], tryIt: "Test that withdrawing too much raises an error." },
      ],
      project: "Model GitHub data: `Repo`, `Issue` and `PullRequest` classes loaded from a JSON file, with methods like `open_issues()` and `good_first_issues()`, and pytest tests.",
      quiz: [
        { q: "What does `self` refer to inside a method?", options: ["The class", "The object the method was called on", "The module"], answer: 1, why: "`self` is the specific object, e.g. `account.deposit(5)` passes `account` as self." },
        { q: "What does `@dataclass` generate for you?", options: ["A database", "`__init__`, `__repr__` and `__eq__`", "Type checking at runtime"], answer: 1, why: "dataclasses write the common boilerplate methods automatically." },
        { q: "When is inheritance the right choice?", options: ["When A “is a” B", "When A “has a” B", "Always"], answer: 0, why: "Use inheritance for is-a (SavingsAccount is a BankAccount); use composition for has-a." },
      ],
      videos: [CS50P_VIDEOS],
      websites: [
        { title: "Official tutorial: Classes", domain: "docs.python.org", url: `${DOCS}/tutorial/classes.html`, description: "Classes, inheritance, iterators and generators.", type: "Official Docs" },
        { title: "dataclasses reference", domain: "docs.python.org", url: `${DOCS}/library/dataclasses.html`, description: "All dataclass options with examples.", type: "Official Docs" },
        { title: "enum reference", domain: "docs.python.org", url: `${DOCS}/library/enum.html`, description: "Creating and using Enums.", type: "Official Docs" },
        { title: "Pydantic documentation", domain: "docs.pydantic.dev", url: "https://docs.pydantic.dev/latest/", description: "Data validation with Python type hints.", type: "Official Docs" },
        { title: "pytest: Get started", domain: "docs.pytest.org", url: "https://docs.pytest.org/en/stable/getting-started.html", description: "Install pytest and write your first test.", type: "Guide" },
      ],
    },

    // ───────────────────────── Stage 4 ─────────────────────────
    {
      id: "pyc-s4",
      stageNumber: 4,
      title: "Data handling and data science",
      summary: "Jupyter, NumPy, Pandas, Matplotlib and Seaborn, cleaning workflows, basic statistics and a first machine-learning model.",
      description: "How to load, clean, analyse and visualise real data with the tools data scientists use every day.",
      youCanNow: "take a messy real dataset, answer questions about it and present the results with charts.",
      estimatedHours: "3–4 weeks",
      concepts: ["Jupyter notebooks", "NumPy arrays", "Broadcasting", "Pandas DataFrames", "groupby", "merge", "Missing data", "Matplotlib", "Seaborn", "EDA", "Statistics", "scikit-learn"],
      keyTakeaways: [
        "Think in whole columns, not loops: vectorised NumPy/Pandas code is shorter and much faster.",
        "Always look at your data first: `head()`, `info()`, `describe()`.",
        "Clean before you analyse: missing values and duplicates change your answers.",
        "Correlation is not causation.",
      ],
      modules: [
        { id: "py-4-1", title: "4.1 Working environment", topics: ["Jupyter notebooks in VS Code or JupyterLab", "Code and Markdown cells; restarting the kernel", "`pip install numpy pandas matplotlib seaborn`"], tryIt: "Create a notebook and write a Markdown title plus one code cell." },
        { id: "py-4-2", title: "4.2 NumPy: fast numbers", topics: ["Why arrays beat lists for numbers", "`np.array`, `dtype`, `shape`, `ndim`", "`arange`, `linspace`, `zeros`, `ones`, `np.random`", "Indexing, slicing, boolean masks: `a[a > 5]`", "Vectorised maths and broadcasting", "`sum mean std min max argmax` with `axis`", "`reshape`, stacking, a first look at matrix maths"], tryIt: "Convert a list of temperatures from °C to °F in one line." },
        { id: "py-4-3", title: "4.3 Pandas: tables of data", topics: ["`Series` and `DataFrame`; `read_csv`, `read_excel`, `read_json`", "`head info describe shape dtypes`", "Selecting columns, `loc`, `iloc`; filtering rows", "Sorting, new columns, renaming", "Missing data: `isna fillna dropna`; duplicates", "`groupby` + `agg`; `value_counts`; pivot tables", "`merge`, `join`, `concat`", "Dates, text columns (`.str`), `apply` vs vectorised", "`to_csv`, `to_excel`"], tryIt: "Load a CSV and find the average value per category." },
        { id: "py-4-4", title: "4.4 Visualisation", topics: ["Matplotlib: line, bar, histogram, scatter", "Titles, labels, legends", "Seaborn for statistical charts", "Choosing the right chart for the question"], tryIt: "Plot a bar chart of the top 5 categories." },
        { id: "py-4-5", title: "4.5 The analysis workflow", topics: ["Question → load → clean → explore → visualise → conclude", "Exploratory data analysis (EDA) checklist", "Spotting outliers and bad data"] },
        { id: "py-4-6", title: "4.6 Statistics you actually need", topics: ["Mean, median, mode", "Range, standard deviation, percentiles", "Distributions", "Correlation vs causation; sampling bias"] },
        { id: "py-4-7", title: "4.7 Taking it further (optional)", topics: ["scikit-learn: train/test split, linear regression, accuracy", "A look at Polars for bigger data", "Getting data from an API with `requests`"] },
      ],
      project: "Analyse a real public dataset in a notebook: clean it, answer 5 questions, make 4 charts and write your conclusions in Markdown cells.",
      quiz: [
        { q: "What does `df.head()` show?", options: ["The column names only", "The first 5 rows", "Summary statistics"], answer: 1, why: "`head()` shows the first rows; `describe()` gives statistics." },
        { q: "Why prefer `arr * 2` over a for-loop in NumPy?", options: ["It's vectorised: shorter and much faster", "Loops don't work on arrays", "It uses less memory always"], answer: 0, why: "NumPy runs the operation on the whole array in fast compiled code." },
        { q: "Two columns are strongly correlated. What can you conclude?", options: ["One causes the other", "They move together, cause unknown", "The data is wrong"], answer: 1, why: "Correlation shows a relationship, not a cause." },
      ],
      videos: [],
      websites: [
        { title: "NumPy: the absolute basics for beginners", domain: "numpy.org", url: "https://numpy.org/doc/stable/user/absolute_beginners.html", description: "The official beginner guide to arrays.", type: "Official Docs" },
        { title: "10 minutes to pandas", domain: "pandas.pydata.org", url: "https://pandas.pydata.org/docs/user_guide/10min.html", description: "The official quick tour of Pandas.", type: "Official Docs" },
        { title: "Kaggle Learn: Pandas", domain: "kaggle.com", url: "https://www.kaggle.com/learn/pandas", description: "Free hands-on Pandas exercises in the browser.", type: "Interactive Tutorial" },
        { title: "Kaggle Learn: Data Visualization", domain: "kaggle.com", url: "https://www.kaggle.com/learn/data-visualization", description: "Free hands-on charts with Seaborn.", type: "Interactive Tutorial" },
        { title: "Matplotlib quick start", domain: "matplotlib.org", url: "https://matplotlib.org/stable/users/explain/quick_start.html", description: "Official introduction to plotting.", type: "Official Docs" },
      ],
    },

    // ───────────────────────── Stage 5 ─────────────────────────
    {
      id: "pyc-s5",
      stageNumber: 5,
      title: "Contributor-ready Python",
      summary: "Real project tools and habits: pyproject.toml, Ruff, mypy, pytest in depth, logging, reading a codebase and your first contribution.",
      description: "The tools and habits real Python projects expect, so you can make your first open-source contribution.",
      youCanNow: "set up a real Python project, make a change, test it and open a pull request.",
      estimatedHours: "1–2 weeks",
      concepts: ["pyproject.toml", "uv / pip", "Ruff", "mypy", "pytest fixtures", "logging", "argparse", "Reading a codebase"],
      keyTakeaways: [
        "Follow the project's CONTRIBUTING guide before writing any code.",
        "Run the tests before and after your change.",
        "Small, focused pull requests get merged faster.",
      ],
      modules: [
        { id: "py-5-1", title: "5.1 Project structure and tools", topics: ["`pyproject.toml`, packages, the `src/` layout", "`pip` or `uv`; virtual environments", "Ruff for linting and formatting; mypy for type checking"] },
        { id: "py-5-2", title: "5.2 Testing and code quality", topics: ["pytest fixtures and parametrised tests", "Test coverage", "`logging` instead of `print`", "Command-line apps with `argparse`"] },
        { id: "py-5-3", title: "5.3 Reading someone else's code", topics: ["Start from the README and CONTRIBUTING", "Follow one feature through the files", "Search the codebase; read the tests"] },
        { id: "py-5-4", title: "5.4 Your first contribution", topics: ["Find a Python “good first issue” on Reporbit", "Ask to be assigned; fork, branch, change, test", "Open a pull request and respond to review"] },
      ],
      project: "Make a real contribution: fix a small bug, add a test or improve docs in an open-source Python project you found on Reporbit.",
      quiz: [
        { q: "What should you read first in a new project?", options: ["The newest file", "README and CONTRIBUTING", "The tests only"], answer: 1, why: "They explain how to set up the project and what maintainers expect." },
        { q: "What does Ruff do?", options: ["Runs tests", "Finds style problems and formats code", "Deploys the app"], answer: 1, why: "Ruff is a fast linter and formatter." },
        { q: "Which pull request is most likely to be merged?", options: ["A small, focused one with tests", "One that changes many unrelated things", "One without a description"], answer: 0, why: "Maintainers can review small, focused changes quickly." },
      ],
      videos: [],
      websites: [
        { title: "Python Packaging User Guide", domain: "packaging.python.org", url: "https://packaging.python.org/en/latest/tutorials/packaging-projects/", description: "How pyproject.toml and packages work.", type: "Guide" },
        { title: "Ruff documentation", domain: "docs.astral.sh", url: "https://docs.astral.sh/ruff/", description: "Fast Python linter and formatter.", type: "Official Docs" },
        { title: "pytest documentation", domain: "docs.pytest.org", url: "https://docs.pytest.org/en/stable/", description: "Fixtures, parametrize and more.", type: "Official Docs" },
        { title: "Logging HOWTO", domain: "docs.python.org", url: `${DOCS}/howto/logging.html`, description: "When and how to use logging.", type: "Guide" },
      ],
    },
  ],
};

// Stage 1.8 cheat sheet: built-in functions every beginner must know.
export const PYTHON_BUILTINS: { group: string; items: { name: string; example: string }[] }[] = [
  { group: "Input and output", items: [
    { name: "print", example: 'print("Hi", name, sep=", ")' },
    { name: "input", example: 'age = input("Age? ")' },
    { name: "open", example: 'with open("a.txt") as f: text = f.read()' },
  ] },
  { group: "Types and conversion", items: [
    { name: "int / float / str / bool", example: 'int("42") → 42' },
    { name: "list / tuple / set / dict", example: 'set([1, 1, 2]) → {1, 2}' },
    { name: "type", example: 'type(3.5) → <class \'float\'>' },
    { name: "isinstance", example: 'isinstance(5, int) → True' },
  ] },
  { group: "Working with sequences", items: [
    { name: "len", example: 'len("hello") → 5' },
    { name: "range", example: 'list(range(1, 6, 2)) → [1, 3, 5]' },
    { name: "enumerate", example: 'for i, x in enumerate(items): ...' },
    { name: "zip", example: 'dict(zip(names, ages))' },
    { name: "sorted / reversed", example: 'sorted([3, 1, 2]) → [1, 2, 3]' },
    { name: "sum / min / max", example: 'max([4, 9, 2]) → 9' },
    { name: "any / all", example: 'any(x > 5 for x in nums)' },
    { name: "map / filter", example: 'list(map(str.upper, ["a", "b"]))' },
  ] },
  { group: "Numbers", items: [
    { name: "abs", example: 'abs(-7) → 7' },
    { name: "round", example: 'round(3.14159, 2) → 3.14' },
    { name: "pow", example: 'pow(2, 10) → 1024' },
    { name: "divmod", example: 'divmod(17, 5) → (3, 2)' },
  ] },
  { group: "Characters and number bases", items: [
    { name: "chr / ord", example: 'ord("A") → 65, chr(65) → "A"' },
    { name: "bin / hex", example: 'bin(5) → "0b101"' },
  ] },
  { group: "Exploring and getting help", items: [
    { name: "help", example: 'help(str.split)' },
    { name: "dir", example: 'dir(list)' },
    { name: "id", example: 'id(x) == id(y)' },
  ] },
];
