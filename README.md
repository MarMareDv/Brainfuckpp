# Brainfuckpp
Brainfuck Transpiled Programming Language meant to imitate fairly modern syntax with scripting specifically tailored for development in Brainfuck, alongside an interlanguage designed for easy brainfuck scripting in a common almost algebraic expression format.

Example Hello World Program
```
#includes libs/system.js
var out: char[12] = "Hello World!";

exec {
    |Prints out Hello World|
    print(out)
}

|Sections the code into the preProcess|
#section preproc
```
