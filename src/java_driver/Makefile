.PHONY: build

build:
	javac -cp "lib/*:." Driver.java

# Prevent pattern rule from trying to rebuild the Makefile itself
Makefile: ;

# Usage: make twoSum  -> runs `java ... Driver twoSum`
%: build
	java -cp "lib/*:." Driver $@
