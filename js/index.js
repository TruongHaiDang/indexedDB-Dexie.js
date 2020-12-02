$(document).ready(function() {
    // ------------------------------------------------------------ DECLARING FUNCTION AND VARIABLE ------------------------------------------------------------ //
    var count = 1;

    function createIndexedDB(dbName, dbVersion, table, upgrade) {  
        const db = new Dexie(dbName)
        db.version(dbVersion).stores(table)
            .upgrade(tx => {
                upgrade
            });
        db.open();
        window.db = db;
        return db;
    }
    
    var db = createIndexedDB("to-Do List", 1, {
                toDo: `++id, *task, date, time`
            }, {});
    
    var getAllDocs = function() {
        db.toDo.count((cnt) => {
            if(cnt) {
                $(".task-added-element").remove();
                db.toDo.each((record) => {
                    createEl(record)
                })
            }
        })
    }
    
    var addDocs = function () {
        let data = {
            task : document.getElementById("task").value,
            date : document.getElementById("date").value,
            time : document.getElementById("time").value
        }
        if (data.task != "" && data.date != "" && data.time != "") {
            db.toDo.bulkAdd([data])
                .then((result) => {
                    document.getElementById("task").value = document.getElementById("date").value = document.getElementById("time").value = "";
                    getAllDocs();
                    alert("added successfully")
                }).catch((err) => {
                    alert("added fail")
                });
        }else {
            alert("please fill al fields")
        }
    }
    
    var updateDocs = function() {
        let data = {
            id : Number(document.getElementById("id").value),
            task : document.getElementById("task").value,
            date : document.getElementById("date").value,
            time : document.getElementById("time").value
        }
        if (data.task != "" && data.date != "" && data.time != "") {
            db.toDo.put(data).then(() => {
                document.getElementById("task").value = document.getElementById("date").value = document.getElementById("time").value = "";
                getAllDocs();
                alert("update successfully")
            }).catch((err) => {
                alert("update fail")
            });
        }else {
            alert("please fill al fields")
        }
    }
    
    var deleteAllDocs = function() {
        db.toDo.clear()
    }
    
    var createEl = function(record) {
        $("#task-added").append(`
            <div class="row justify-content-lg-center task-added-element">
                <div class="col-lg-2">
                    <h3 class="detail">${record.id}</h3>
                </div>
                <div class="col-lg-4">
                    <h3 class="detail">${record.task}</h3>
                </div>
                <div class="col-lg-2">
                    <h3 class="detail">${record.date}</h3>
                </div>
                <div class="col-lg-2">
                    <h3 class="detail">${record.time}</h3>
                </div>
                <div class="col-lg-1">
                    <i onclick="editTask(${record.id}, '${record.task}', '${record.date}', '${record.time}')" class="fas fa-edit fa-2x"></i>
                </div>
                <div class="col-lg-1">
                    <i onclick="deleteTask(${record.id})" class="fas fa-trash-alt fa-2x"> </i> 
                </div>
            </div>
        `)
    }

    var reverseSortRecord = function(action) {
        if(action == "a2z") {
            db.toDo.count((cnt) => {
                if(cnt) {
                    let sorta2z = db.toDo.orderBy("task").limit(count);
                    $(".task-added-element").remove();
                    sorta2z.each((record) => {
                        createEl(record)
                    })
                }
            })
        }else if(action == "z2a") {
            db.toDo.count((cnt) => {
                if(cnt) {
                    let sorta2z = db.toDo.orderBy("task").desc().limit(count);
                    $(".task-added-element").remove();
                    sorta2z.each((record) => {
                        createEl(record)
                    })
                }
            })
        }else if(action =="reverse"){
            db.toDo.count((cnt) => {
                if(cnt) {
                    let sorta2z = db.toDo.reverse().limit(count);
                    $(".task-added-element").remove();
                    sorta2z.each((record) => {
                        createEl(record)
                    })
                }
            })
        }
    }

    // ------------------------------------------------------------ EVENTS PROCESSING ------------------------------------------------------------ //

    $("#addDocs").click(() => { 
        addDocs();
    });

    $("#getAllDocs").click(() => { 
        getAllDocs();
    });

    $("#updDocs").click(() => { 
        updateDocs();
    });

    $("#delAllDocs").click(() => { 
        deleteAllDocs();
    });

    $("#sortaz").click(function () { 
        reverseSortRecord("a2z");
    });

    $("#sortza").click(function () { 
        reverseSortRecord("z2a");
    });

    $("#reverse").click(function () { 
        reverseSortRecord("reverse")
    });

    $("#slider").change(function (e) { 
        e.preventDefault();
        document.getElementById("qty").innerHTML = e.target.value;
        count = e.target.value;
    });
})

// ---------------------------------------------------------------- OUT OF JQUERY ----------------------------------------------------------------- //

var db;

var editTask = function (id, task, date, time) {  
    document.getElementById("id").value = id,
    document.getElementById("task").value = task,
    document.getElementById("date").value = date,
    document.getElementById("time").value = time
}

var deleteTask = function(id) {
    db.toDo.delete(id).then(() => alert("delete successfully"))
}