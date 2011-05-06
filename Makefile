test:
	./support/expresso/bin/expresso -I lib test/*.js

install:
	npm install . && npm update

.PHONY: test