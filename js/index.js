// id = document.getElementById("id").value;
// task = document.getElementById("task").value;
// date = document.getElementById("date").value;
// time = document.getElementById("time").value; 

function createIndexedDB(dbName, dbVersion, table, upgrade) {  
    const db = new Dexie(dbName)
    db.version(dbVersion).stores(table)
        .upgrade(tx => {
            upgrade
        });
    db.open();
    return db;
}

var db = createIndexedDB("to-Do List", 1, {
            toDo: `++id, *task, date, time`
        }, {});

function getDocs() {
    db.toDo.count((cnt) => {
        if(cnt) {
            db.toDo.each((record) => {
                console.log(record)
            })
        }
    })
}

function addDocs() {
    let data = {
        task : document.getElementById("task").value,
        date : document.getElementById("date").value,
        time : document.getElementById("time").value
    }
    db.toDo.bulkAdd([data])
        .then((result) => {
            document.getElementById("task").value = document.getElementById("date").value = document.getElementById("time").value = "";
            alert("added successfully")
        }).catch((err) => {
            alert("added fail")
        });
}

function updateDocs() {
    
}

function deleteDocs() {
    
}

// let db = createIndexedDB("to-Do List", 1, {
//     toDo: `++id, *task, date, time`
// }, {});