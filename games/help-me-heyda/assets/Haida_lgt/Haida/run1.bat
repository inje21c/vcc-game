set main_class=Haida

javac -bootclasspath C:\LGT\classes -d classes src\*.java

C:\LGT\bin\preverify.exe -classpath .;c:\LGT\classes\; -d output classes

C:\LGT\bin\midp.exe -nocommand -classpath output %main_class%