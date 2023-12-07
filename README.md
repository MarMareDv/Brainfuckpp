# Brainfuckpp
Brainfuck Transpiled Programming Language meant to imitate fairly modern syntax with scripting specifically tailored for development in Brainfuck, alongside an interlanguage designed for easy brainfuck scripting in a common almost algebraic expression format.

Example Hello World Program
```
#includes libs/system.js
var out: char[12]

exec {
    |Prints out Hello World|
    setString(out "Hello World!")
    print(out)
    uncall(ProcLoop) |Closes The Program Process Loop|
}

|Sections the code into the preProcess|
#section preproc
```
