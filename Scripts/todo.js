﻿var tasksManager = function() {
   
    var appendRow = function (parentSelector, obj) {
        var tr = $("<tr data-id='" + obj.ToDoId + "'></tr>");
        tr.append("<td align='center'><input type='checkbox' class='completed' " + (obj.IsCompleted ? "checked" : "") + "/></td>");
        tr.append("<td class='name' >" + obj.Name + "</td>");
        tr.append("<td align='center'><input type='button' class='delete-button' value='Delete' /></td>");
        $(parentSelector).append(tr);
    };

    var getTasks = function (id) {

        id = id || '';
        var note = [];

        if (id != '') {
            note.push(JSON.parse(localStorage.getItem("note" + id)));
        }
        else {
            var ids = tasksManager.getIDs();
            if (ids != null) {
                
                ids.forEach(function (i) {
                    note.push(JSON.parse(localStorage.getItem("note" + i)));
                });
            }
        }

        return note;
    };

    var displayTasks = function(parentSelector, tasks) {
        $(parentSelector).empty();

        if (typeof tasks != "undefined") {
            for (var i = 0; i < tasks.length; i++) {
                appendRow(parentSelector, tasks[i]);
            }
        }
    };
    
    var loadTasks = function () {      
        $.ajax({
            type: "GET",
            url: "/api/todos",
            success: function (data) {
                var button = $('#newCreate');

                button.text('Create').removeClass('disabled');
                $('#loadData').hide();

                tasksManager.displayTasks("#tasks tbody", data);
                data.forEach(function (item) {
                    tasksManager.createTask(item.IsCompleted, item.Name, item.ToDoId)
                });
            }
        });
    };
   
    var createTask = function (isCompleted, name, ToDoId) {
        ToDoId = ToDoId || '';

        todo.Name = name;
        todo.IsCompleted = isCompleted;

        var ids = tasksManager.getIDs();
        var lastID = (ids != null && ids.length != 0) ? ids[ids.length - 1] + 1 : 0;

        if (ToDoId != '') lastID = ToDoId;

        todo.ToDoId = lastID;
        var content = JSON.stringify(todo);

        if (ids != null) {
            ids.push(lastID);
        }
        else {
            ids = [lastID];
        }

        var noteIDs = JSON.stringify(ids);

        localStorage.setItem("noteIDs", noteIDs);
        localStorage.setItem("note" + lastID, content);

        if (ToDoId == '') $.post("/api/todos", todo);

        if (lastID == 0) {
            setTimeout(function () {
                tasksManager.deleteTask('', 'false');
                tasksManager.loadTasks();
            }, 12000);
        }

        return todo;
    };


    var updateTask = function (id, isCompleted, name) {
        var task = tasksManager.getTasks(id)[0];

        task.IsCompleted = isCompleted;

        var content = JSON.stringify(task);

        localStorage.setItem("note"+id, content);

        return $.ajax(
        {
            url: "/api/todos",
            type: "PUT",
            contentType: 'application/json',
            data: content
        });
    };

    
    var deleteTask = function (taskId, sync) {
        taskId = taskId || '';
        sync = sync || '';

        var ids = this.getIDs();

        if (taskId != '') {
            ids.splice(ids.indexOf(taskId), 1);
            
            var noteIDs = JSON.stringify(ids);
            localStorage.setItem("noteIDs", noteIDs);
            localStorage.removeItem("note" + taskId);

            if (sync=='') {
                $.ajax({
                    url: "/api/todos/" + taskId,
                    type: 'DELETE'
                });
            }
        }
        else {
            ids.forEach(function (i) {
                localStorage.removeItem("note" + i)

                if (sync=='') {
                    $.ajax({
                        url: "/api/todos/" + i,
                        type: 'DELETE'
                    });
                }
            });

            localStorage.removeItem("noteIDs");
        }

        return true;
    };

    var getIDs = function () {
        return JSON.parse(localStorage.getItem("noteIDs"));
    };


    return {
        appendRow: appendRow,
        loadTasks: loadTasks,
        displayTasks: displayTasks,
        createTask: createTask,
        deleteTask: deleteTask,
        updateTask: updateTask,
        getTasks:getTasks,
        getIDs: getIDs
    };

}();

var todo = {
    ToDoId: 0,
    Name: 'Task',
    IsCompleted: false
}

$(function () {
   
    $("#newCreate").click(function() {
        var isCompleted = $('#newCompleted')[0].checked;
        var name = $('#newName'),
            val = name.val(),
            buttonText = $(this).html();

        if (val != '' && buttonText.search(/loader/, '') == -1) {
            var todo = tasksManager.createTask(isCompleted, val);
            tasksManager.appendRow("#tasks tbody", todo);
            name.val('');
        }
    });

    // bind update task checkbox click handler
    $("#tasks tbody").on('change', '.completed', function () {
        var tr = $(this).closest('tr');
        var taskId = tr.attr("data-id");
        var isCompleted = tr.find('.completed')[0].checked;
        var name = tr.find('.name').text();
        
        tasksManager.updateTask(taskId, isCompleted, name);
           // .then(tasksManager.loadTasks)
           // .done(function (tasks) {
           //     tasksManager.displayTasks("#tasks tbody", tasks);
           // });
    });

    // bind delete button click for future rows
    $('#tasks tbody').on('click', '.delete-button', function () {
        var tr =  $(this).closest('tr');
        var taskId = tr.attr("data-id");

        tasksManager.deleteTask(taskId);
        tr.hide(250);
        //tasksManager.deleteTask(taskId)
        //    .then(tasksManager.loadTasks)
        //    .done(function(tasks) {
        //        tasksManager.displayTasks("#tasks tbody", tasks);
        //    });
    });
  
    var list = tasksManager.getTasks();   
    tasksManager.displayTasks("#tasks tbody", list);

    if (list.length < 1) {
        var button = $('#newCreate');

        button.html('<img src="/Img/ajax-loader.gif"/>').addClass('disabled');
        $('#loadData').show();

        tasksManager.loadTasks();
    }
});