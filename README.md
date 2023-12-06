# Brainfuckpp
Brainfuck Transpiled Programming Language meant to imitate somewhat Kotlin style syntax with scripting specifically tailored for development in Brainfuck, alongside an interlanguage designed for easy brainfuck scripting in a common almost algebraic expression format.

Example Hello World Program
```
#includes libs/system.js
#includes libs/controlflow.js

var main: proc
var test: char

exec {
    call(main)
    setChar(test[0] "a")
}

#section preproc

proc main {
    print(test)
}
```
