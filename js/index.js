// Bắt đầu với jquery
$(document).ready(function() {
    // ------------------------------------------------------------ DECLARING FUNCTION AND VARIABLE ------------------------------------------------------------ //
    var count = 1;
    document.getElementById("slider").max = 1;
    Dexie.debug = true;
    /**
     * Hàm createIndexedDB dùng để tạo database nếu chưa tồn tại hoặc kết nối với cơ sở dữ liệu nếu đã tồn tại
     * Tham số: dbName tên database
     *          dbVersion phiên bản database
     *          table cấu trúc database khi khởi tạo
     *          upgrade cấu trúc database khi nâng cấp
     * upgrade() chỉ kích hoạt khi dbVersion thay đổi
     * 
     * đối tượng table và upgrade tham khảo phần "Declare Database" ở link sau https://dexie.org/docs/API-Reference#quick-reference
     * khi khởi tạo chỉ đưa những thứ cần thiết vào table, sau này có thể sử dụng Dexie.defineClass() hoặc Table.mapToClass() để tạo thêm objectStore
     */
    function createIndexedDB(dbName, dbVersion, table, upgrade) {  
        const db = new Dexie(dbName)
        db.version(dbVersion).stores(table)
            .upgrade(tx => {
                upgrade
            });
        /**
         * Tính năng của Dexie.Observable một addons của dexie có tính năng đồng bộ database
         * Để xử dụng được cần thư viện "dexie-observable.min.js" và thay ký tự khai báo khóa chính mặc định là ++ thành &&
         * Chi tiết tại link https://dexie.org/docs/Observable/Dexie.Observable
         */
        db.on('changes', function (changes) {
            changes.forEach(function (change) {
            switch (change.type) {
                case 1: // CREATED
                {
                    // console.log('An object was created: ' + JSON.stringify(change.obj));
                    break;
                }
                case 2: // UPDATED
                {
                    // console.log('An object with key ' + change.key + ' was updated with modifications: ' + JSON.stringify(change.mods));
                    break;
                }   
                case 3: // DELETED
                {
                    // console.log('An object was deleted: ' + JSON.stringify(change.oldObj));
                    break;
                }
                }
            });
        });
        db.open(); // Gọi khi hoàn tất để xác nhận khởi tạo database
        window.db = db; // Truyền đối tượng db ra bên ngoài jquery (*)
        return db;
    }
    /**
     * Đoạn code dưới khởi tạo đối tượng db 
     * db là một đối tượng dexie trả về khi tạo hoặc kết nối với cơ sở dữ liệu từ hàm createIndexedDB()
     * trong indexedDB để thực hiện thêm xóa sửa đều phải thực hiện theo quy trình: khởi tạo/kết nối database => kết nối objectStore(nơi chứa dữ liệu) => thao tác người dùng muốn
     * (*) đây là lý do mà có dòng window.db = db ở trên vì bên ngoài jquery không nhận được đối tượng db
     */
    var db = createIndexedDB("To-Do-List", 1, {
                toDo: `$$_id, *task, date, time`
            }, {});
    /**
     * Trong dexie.js thuộc tính on dùng để lắng nghe sự kiện
     * ready: là database đã được tạo hoàn toàn và có thẻ hoạt động, db.verno cung cấp phiên bản hiện tại của database
     * versionchange: kích hoạt khi dbVersion thay đổi, đoạn code dưới dùng để thông báo rằng phiên bản cơ sở dữ liệu đã được thay đổi và tải lại trang
     * vì indexedDB sẽ không hoạt động nếu phiên bản(dbVersion) bị lỗi thời
     */
    db.on("ready", function() { console.log("Database is ready with version " + db.verno); });

    db.on("versionchange", function(event) {
        if (confirm ("Another page tries to upgrade the database to version " +
                        event.newVersion + ". Accept?")) {
            window.location.reload();
        } else {
            return false;
        }
    });
    /**
     * db là một đối tượng dexie trả về khi kết nối với database 
     * objectStore là toDo
     * count() cho biết số lượng bản ghi có trong objectStore
     * each() duyệt qua từng bản ghi trong objectStore
     */
    var getAllDocs = function() {
        db.toDo.count((cnt) => {
            if(cnt) {
                $(".task-added-element").remove();
                document.getElementById("slider").max = cnt;
                db.toDo.each((record) => {
                    createEl(record)
                })
            }
        })
    }
    // hook hoạt động giống như on, dùng để lắng nghe sự kiện
    db.toDo.hook('deleting', function (primKey, obj, transaction) {
        getAllDocs();
    });
    // bulkAdd() dùng để ghi nhiều dữ liệu tương ứng có Add() mỗi lần chỉ ghi một dữ liệu
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
                    console.log("added successfully")
                }).catch((err) => {
                    console.log("added fail: " + err)
                });
        }else {
            alert("please fill al fields")
        }
    }
    /**
     * put()/bulkPut() có hai chức năng một là ghi dữ liệu vào objectStore nếu nó chưa tồn tại hoặc cập nhật nếu nó đã tồn tại 
     * dữ liệu tồn tại hay chưa dựa vào trường khóa chính hay id (khóa chính là trường mà có hai dấu ++ hoặc $$ ở trước khi khởi tạo database)
     * nếu id giống nhau thì là đã tồn tại và ngược lại 
     * Chú ý là Add()/bulkAdd() không thể làm được việc này
     */ 
    var updateDocs = function() {
        let data = {
            _id : document.getElementById("id").value,
            task : document.getElementById("task").value,
            date : document.getElementById("date").value,
            time : document.getElementById("time").value
        }
        if (data.task != "" && data.date != "" && data.time != "") {
            db.toDo.put(data).then(() => {
                document.getElementById("task").value = document.getElementById("date").value = document.getElementById("time").value = "";
                getAllDocs();
                console.log("update successfully")
            }).catch((err) => {
                console.log("update fail")
            });
        }else {
            alert("please fill al fields")
        }
    }
    // clear() là một hàm của objectStore có chức năng xóa hết bản ghi trong objectStore đó, hàm này tác động lên objectStore
    var deleteAllDocs = function() {
        db.toDo.clear().then(() => {
            console.log("delete successfully")
        })
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
                    <i onclick="editTask('${record._id}', '${record.task}', '${record.date}', '${record.time}')" class="fas fa-edit fa-2x"></i>
                </div>
                <div class="col-lg-1">
                    <i onclick="deleteTask('${record._id}')" class="fas fa-trash-alt fa-2x"> </i> 
                </div>
            </div>
        `)
    }
    /**
     * Dexie.js cung cấp nhiều chức năng lọc và làm nó gần với quy chuẩn nhất có thể
     * vd: where(), orderBy(), sortBy(), limit(),...
     * vì các hàm trong indexedDB là các promise nên có thể kết hợp các hàm lọc lại với nhau
     * vd: db.friends
            .where('age').above(25)
            .orderBy('name').limit(5)
        
     */
    var reverseSortRecord = function(action) {
        switch(action) {
            case "a2z": 
            {
                db.toDo.count((cnt) => {
                    if(cnt) {
                        let sorta2z = db.toDo.orderBy("task").limit(count);
                        $(".task-added-element").remove();
                        sorta2z.each((record) => {
                            createEl(record)
                        })
                    }
                });
                break;
            }
            case "z2a": 
            {
                db.toDo.count((cnt) => {
                    if(cnt) {
                        let sorta2z = db.toDo.orderBy("task").desc().limit(count);
                        $(".task-added-element").remove();
                        sorta2z.each((record) => {
                            createEl(record)
                        })
                    }
                });
                break;
            }
            case "reverse": 
            {
                db.toDo.count((cnt) => {
                    if(cnt) {
                        let sorta2z = db.toDo.reverse().limit(count);
                        $(".task-added-element").remove();
                        sorta2z.each((record) => {
                            createEl(record)
                        })
                    }
                });
                break;
            }
        }
    }
    /**
     * Kết nối tới socket server có chức năng đồng bộ
     * các tham số lần lượt là:
     * - protocol: giao thức được định nghĩa trong WebSocketSyncProtocol.js
     * - server url: url trỏ tới socket server có chức năng đồng - lưu ý bộ bắt đầu bằng ws: hoặc wss:
     */
    db.syncable.connect ("websocket", "ws://localhost:8001");
    db.syncable.on('statusChanged', function (newStatus, url) {
        console.log ("Sync Status changed: " + Dexie.Syncable.StatusTexts[newStatus]);
    });

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

var db; // (*) biến hứng - nhận đối tượng db

var editTask = function (id, task, date, time) {  
    document.getElementById("id").value = id,
    document.getElementById("task").value = task,
    document.getElementById("date").value = date,
    document.getElementById("time").value = time
}
// delete() dùng để xóa bản ghi, hàm này tác động lên bản khi không phải objectStore, tương ứng là bulkDelete()
var deleteTask = function(id) {
    db.toDo.delete(id).then(() => console.log("delete successfully"))
}

// Truy cập https://dexie.org/docs để có thêm thông tin