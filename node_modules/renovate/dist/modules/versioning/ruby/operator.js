const SINGLE = ["="];
const ALL = [
	"=",
	"!=",
	">",
	"<",
	">=",
	"<=",
	"~>"
];
const isValidOperator = (operator) => ALL.includes(operator);
const isSingleOperator = (operator) => SINGLE.includes(operator);
//#endregion
export { isSingleOperator, isValidOperator };

//# sourceMappingURL=operator.js.map