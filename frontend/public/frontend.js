document.getElementById("add-dataset").addEventListener("change", putDataset);
let fileReader = new FileReader();
const params = new URLSearchParams(window.location.search);
// const yearCheck = new XMLHttpRequest();
// let validYear = 0;
//
// yearCheck.onreadystatechange = function() {
// 	if (this.readyState === 4 && this.status === 200) {
// 		if (JSON.parse(JSON.parse(yearCheck.response)["result"]).length === 0) {
// 			alert("Course(s) did not run in the input years");
// 			validYear = -1;
// 		} else {
// 			validYear = 1;
// 		}
// 	} else if (this.readyState === 4) {
// 		alert("Course(s) did not run in the input years");
// 		validYear = -1;
// 	}
// }

const request = new XMLHttpRequest();
request.onreadystatechange = function() {
	if (this.readyState === 4 && this.status === 200) {
		document.getElementById("display").innerHTML = "Data Added";
	} else if (this.readyState === 4) {
		alert(this.status);
		alert(this.response);
	}
}
const query1 = new XMLHttpRequest();

query1.onreadystatechange = function() {
	if (this.readyState === 4 && this.status === 200) {
		let response = JSON.parse(JSON.parse(query1.response)["result"]);
		if (response.length === 0) {
			alert("Course did not run in the input years");
			return;
		}
		let results = "Course: " + params.get("Dept") + " " + params.get("Course id") + "<br>Years: "
			+ params.get("start year") + "-" + params.get("end year");
		for (let i of response) {
			results += "<br>-------------------------------------------------" + "<br>Instructor: "
				+ i["sections_instructor"] + "<br>Overall Average: " + i["overallAvg"]
				+ "<br>-------------------------------------------------";
		}
		document.getElementById("results1").innerHTML = results;
	} else if (this.readyState === 4) {
		alert("Invalid course code. Try again");
	}
}
const query2 = new XMLHttpRequest();
query2.onreadystatechange = function() {
	if (this.readyState === 4 && this.status === 200) {
		let response = JSON.parse(JSON.parse(query2.response)["result"]);
		if (response.length === 0) {
			alert("Course did not run in the input years");
			return;
		}
		let results = "<br>Years: "	+ params.get("start year1") + "-" + params.get("end year1");
		for (let i of response) {
			results += "<br>-------------------------------------------------" + "<br>Course code: "
				+ i["sections_dept"] + " " + i["sections_id"] + "<br>Overall Average: " + i["overallAvg"]
				+ "<br>-------------------------------------------------";
		}
		document.getElementById("results2").innerHTML = results;
	} else if (this.readyState === 4) {
		alert("Invalid course code. Try again");
	}
}
fileReader.onload = function() {
	request.open("PUT", "http://localhost:4321/dataset/sections/sections");
	request.setRequestHeader("Content-Type", "application/x-zip-compressed");
	request.send(fileReader.result);
	alert("Request Sent");
}

const codeCheck = new XMLHttpRequest();
let validCode = 0;
let query = 0;
codeCheck.onreadystatechange = function() {
	if (this.readyState === 4 && this.status === 200) {
		if (JSON.parse(JSON.parse(codeCheck.response)["result"]).length === 0) {
			alert("Invalid course code. Try again");
			validCode = 0;
		} else {
			validCode++;
		}
	} else if (this.readyState === 4) {
		validCode++;
	}
	console.log(validCode);
	console.log(query);
	if (validCode === 1 && query === 1) {
		query1.open("POST", "http://localhost:4321/query");
		let input = {
			WHERE:	{
				AND: [
					{
						EQ: {
							sections_dept: params.get("Dept").toLowerCase()
						}
					},
					{
						EQ: {
							sections_id: params.get("Course id")
						}
					},
					{
						GT: {
							sections_year: (parseInt(params.get("start year")) - 1)
						}
					},
					{
						LT: {
							sections_year: (parseInt(params.get("end year")) - 1)
						}
					}
				]
			},
			OPTIONS: {
				COLUMNS: [
					"sections_instructor",
					"overallAvg"
				]
			},
			TRANSFORMATIONS: {
				GROUP: ["sections_instructor"],
				APPLY: [
					{
						overallAvg: {
							AVG: "sections_avg"
						}
					}
				]
			}
		};
		query1.setRequestHeader("Content-Type", "application/json");
		query1.send(new Blob([JSON.stringify(input)]));
		validCode = 0;
	}
	if (validCode === 3 && query === 2) {
		query2.open("POST", "http://localhost:4321/query");
		let input = {
			WHERE:	{
				OR: [
					{
						AND: [
							{
								EQ: {
									sections_dept: params.get("Dept1").toLowerCase()
								}
							},
							{
								EQ: {
									sections_id: params.get("Course id1")
								}
							},
							{
								GT: {
									sections_year: (parseInt(params.get("start year1")) - 1)
								}
							},
							{
								LT: {
									sections_year: (parseInt(params.get("end year1")) - 1)
								}
							}
						]
					},
					{
						AND: [
							{
								EQ: {
									sections_dept: params.get("Dept2").toLowerCase()
								}
							},
							{
								EQ: {
									sections_id: params.get("Course id2")
								}
							},
							{
								GT: {
									sections_year: (parseInt(params.get("start year1")) - 1)
								}
							},
							{
								LT: {
									sections_year: (parseInt(params.get("end year1")) - 1)
								}
							}
						]
					},
					{
						AND: [
							{
								EQ: {
									sections_dept: params.get("Dept3").toLowerCase()
								}
							},
							{
								EQ: {
									sections_id: params.get("Course id3")
								}
							},
							{
								GT: {
									sections_year: (parseInt(params.get("start year1")) - 1)
								}
							},
							{
								LT: {
									sections_year: (parseInt(params.get("end year1")) - 1)
								}
							}
						]
					}
				]
			},
			OPTIONS: {
				COLUMNS: [
					"sections_dept",
					"sections_id",
					"overallAvg"
				]
			},
			TRANSFORMATIONS: {
				GROUP: ["sections_dept", "sections_id"],
				APPLY: [
					{
						overallAvg: {
							AVG: "sections_avg"
						}
					}
				]
			}
		};
		query2.setRequestHeader("Content-Type", "application/json");
		query2.send(new Blob([JSON.stringify(input)]));
		validCode = 0;
	} else if (validCode === 1 && query === 2 && codeCheck.readyState === 4) {
		let dept = params.get("Dept2").toLowerCase();
		let id = params.get("Course id2");
		checkCode(dept, id);
	} else if (validCode === 2 && query === 2 && codeCheck.readyState === 4) {
		let dept = params.get("Dept3").toLowerCase();
		let id = params.get("Course id3");
		checkCode(dept, id);
	}
}

if (params.has("Dept") && params.has("Course id") && params.has("start year")
	&& params.has("end year")) {
	let dept = params.get("Dept").toLowerCase();
	let id = params.get("Course id");
	query = 1;
	checkCode(dept, id);
} else if (params.has("Dept1") && params.has("Course id1") && params.has("Dept2")
	&& params.has("Course id2") && params.has("Dept3") && params.has("Course id3")
	&& params.has("start year1") && params.has("end year1")) {

	let dept = params.get("Dept1").toLowerCase();
	let id = params.get("Course id1");
	query = 2;
	checkCode(dept, id);
}
// function checkYear(dept, id, start, end) {
// 	yearCheck.open("POST", "http://localhost:4321/query");
// 	let input = {
// 		WHERE:	{
// 			AND: [
// 				{
// 					EQ: {
// 						sections_dept: dept
// 					}
// 				},
// 				{
// 					EQ: {
// 						sections_id: id
// 					}
// 				},
// 				{
// 					GT: {
// 						sections_year: start
// 					}
// 				},
// 				{
// 					LT: {
// 						sections_year: end
// 					}
// 				}
// 			]
// 		},
// 		OPTIONS: {
// 			COLUMNS: [
// 				"sections_year"
// 			]
// 		}
// 	};
// 	yearCheck.setRequestHeader("Content-Type", "application/json");
// 	yearCheck.send(new Blob([JSON.stringify(input)]));
// }
function checkCode(dept, id) {
	codeCheck.open("POST", "http://localhost:4321/query", false);
	codeCheck.setRequestHeader("Content-Type", "application/json");
	let input = {
		WHERE:	{
			AND: [
				{
					EQ: {
						sections_dept: dept
					}
				},
				{
					EQ: {
						sections_id: id
					}
				}
			]
		},
		OPTIONS: {
			COLUMNS: [
				"sections_dept"
			]
		}
	};
	codeCheck.send(new Blob([JSON.stringify(input)]));
}
function putDataset() {
	const file = document.getElementById("add-dataset").files[0];
	fileReader.readAsArrayBuffer(file);
	alert("Button Clicked!");
}
