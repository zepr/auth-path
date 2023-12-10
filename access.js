var ACCESS = {};



ACCESS.start = function() {
    ACCESS.init();

    // Key listener
    addEventListener('keydown', (event) => {
        ACCESS.key[event.key] = true;
    });
    addEventListener('keyup', (event) => {
        ACCESS.key[event.key] = false;
        if (ACCESS.icon.destroy > 50) {
            ACCESS.init();
        }
    });


    ACCESS.loop();
}


ACCESS.init = function() {

    ACCESS.path = [[0, 0], [0, 1], [1, 2], [2, 0], [2, 1], [1, 0], [1, 1]];


    var canvas = document.getElementById('access');
    canvas.width = 800;
    canvas.height = 800;

    ACCESS.canvas = canvas;
    ACCESS.ctx = canvas.getContext('2d');

    ACCESS.db = document.createElement('canvas');
    ACCESS.db.width = canvas.width;
    ACCESS.db.height = canvas.height;
    ACCESS.dbCtx = ACCESS.db.getContext('2d');

    ACCESS.radius = 0;
    ACCESS.structColor = '#fff';
    ACCESS.itemColor = '#7715c2';

    ACCESS.icon = {};
    ACCESS.icon.x = 300;
    ACCESS.icon.y = 300;
    ACCESS.icon.rot = 0;
    ACCESS.icon.mask = 10;
    ACCESS.icon.destroy = -1;
    
    ACCESS.icon.speed = {};
    ACCESS.icon.speed.x = 0;
    ACCESS.icon.speed.y = 0;

    ACCESS.icon.expl = null;
    ACCESS.icon.code = [];
    ACCESS.icon.node = null;

    ACCESS.icon.prop = [];

    ACCESS.key = {};

    ACCESS.gravity = 0.02;

    // Reset 
    document.getElementById('failure').style.display = 'none';

    // Controls
    var controls = [];
    while (controls.length < 3) {
        var newCtrl = 'abcdefghijklmnopqrstuvwxyz'.charAt(Math.floor(Math.random() * 26));
        for (var i = 0; i < controls.length; i++) {
            if (controls[i] == newCtrl) {
                newCtrl = null;
            }
        }
        if (newCtrl != null) {
            controls.push(newCtrl);
        }
    }

    var ctrlSpan = document.getElementById('controls').getElementsByTagName('span');
    for (var i = 0; i < 3; i++) {
        ctrlSpan[i].innerHTML = controls[i];
    }
    ACCESS.controls = controls;
}


ACCESS.loop = function() {

    if (ACCESS.success) return;

    if (ACCESS.icon.destroy == -1) {
        // Key management
        if (ACCESS.key[ACCESS.controls[0]]) ACCESS.icon.rot -= 0.1;
        if (ACCESS.key[ACCESS.controls[2]]) ACCESS.icon.rot += 0.1;
        
        if (ACCESS.key[ACCESS.controls[1]]) { 
            ACCESS.icon.speed.x += 0.3 * Math.cos(ACCESS.icon.rot);
            ACCESS.icon.speed.y += 0.3 * Math.sin(ACCESS.icon.rot);

            var prop = {};
            prop.x = ACCESS.icon.x;
            prop.y = ACCESS.icon.y;
            var rand = Math.random() * 0.4 - 0.2;
            prop.sx = 4 * Math.cos(ACCESS.icon.rot + Math.PI + rand);
            prop.sy = 4 * Math.sin(ACCESS.icon.rot + Math.PI + rand);
            prop.idx = 0;
            ACCESS.icon.prop.push(prop);
        }

        ACCESS.icon.speed.x *= 0.99;
        ACCESS.icon.speed.y *= 0.99;

        // Gravity
        ACCESS.icon.speed.y += ACCESS.gravity;

        if (ACCESS.icon.node !== null) {
            // Elastic force !!!
            var ex = (ACCESS.icon.node[0] + 1) * 200 - ACCESS.icon.x;
            var ey = (ACCESS.icon.node[1] + 1) * 200 - ACCESS.icon.y;
            var el = Math.sqrt(ex * ex + ey * ey);

            if (el > 50) {
                var force = (el - 50) / 1500;

                ACCESS.icon.speed.x += force * ex / el;
                ACCESS.icon.speed.y += force * ey / el;
            }
        }


        // Move
        ACCESS.icon.x += ACCESS.icon.speed.x;
        ACCESS.icon.y += ACCESS.icon.speed.y;

    }

    /*
     * Collision
     */

    if (ACCESS.icon.destroy == -1) {
        // Borders
        if (ACCESS.icon.x < ACCESS.icon.mask 
            || ACCESS.icon.x > ACCESS.canvas.width - ACCESS.icon.mask
            || ACCESS.icon.y < ACCESS.icon.mask 
            || ACCESS.icon.y > ACCESS.canvas.height - ACCESS.icon.mask
            ) {
            ACCESS.icon.destroy = 0;
        }
        // Plots
        var px = Math.floor((ACCESS.icon.x - 100) / 200);
        var py = Math.floor((ACCESS.icon.y - 100) / 200);

        var dx = ACCESS.icon.x - (px + 1) * 200;
        var dy = ACCESS.icon.y - (py + 1) * 200;
        var distPlot = dx * dx + dy * dy;

        if (distPlot < (15 + ACCESS.icon.mask) * (15 + ACCESS.icon.mask)) {
            ACCESS.icon.destroy = 0;
        }


        /*
        * Code management
        */

        ACCESS.radius += 0.05;
        var radius = 30 + 10 * Math.sin(ACCESS.radius);

        if (distPlot < radius * radius) {
            var node = [px, py];
            if (ACCESS.icon.node == null || ACCESS.icon.node[0] != node[0] || ACCESS.icon.node[1] != node[1]) {
                ACCESS.icon.code.push(node);
                ACCESS.icon.node = node;

                // Check path
                if (ACCESS.path.length == ACCESS.icon.code.length) {
                    var success = true;
                    for (var i = 0; i < ACCESS.icon.code.length; i++) {
                        success &= ACCESS.icon.code[i][0] == ACCESS.path[i][0];
                        success &= ACCESS.icon.code[i][1] == ACCESS.path[i][1];
                    }

                    if (success) {
                        ACCESS.success = true;
                        document.getElementById('success').style.display = 'block';
                    } else {
                        ACCESS.icon.destroy = 0;
                    }
                }
            }
        }
    }

    /*
     * Render
     */

    // Double buffer render
    ACCESS.dbCtx.clearRect(0, 0, ACCESS.db.width, ACCESS.db.height);
    
    // Scene
    ACCESS.dbCtx.lineWidth = 5;
    ACCESS.dbCtx.strokeStyle = ACCESS.structColor;
    ACCESS.dbCtx.rect(0, 0, ACCESS.db.width, ACCESS.db.height);
    ACCESS.dbCtx.stroke();

    for (var i = 200; i <= 600; i += 200) {
        for (var j = 200; j <= 600; j += 200) {

            ACCESS.dbCtx.lineWidth = 5;
            ACCESS.dbCtx.strokeStyle = ACCESS.structColor;
            
            ACCESS.dbCtx.beginPath();
            ACCESS.dbCtx.arc(i, j, 15, 0, 2 * Math.PI, false);
            ACCESS.dbCtx.stroke();

            ACCESS.dbCtx.lineWidth = 1;
            ACCESS.dbCtx.strokeStyle = ACCESS.itemColor;

            ACCESS.dbCtx.beginPath();
            ACCESS.dbCtx.arc(i, j, radius, 0, 2 * Math.PI, false);
            ACCESS.dbCtx.stroke();
        }
    }

    // Ugly Patch!!!
    ACCESS.dbCtx.beginPath();
    ACCESS.dbCtx.arc(-20, -20, 1, 0, 2 * Math.PI, false);
    ACCESS.dbCtx.stroke();

    // Icon
    if (ACCESS.icon.destroy == -1) {
        if (ACCESS.icon.node !== null) {
            ACCESS.dbCtx.lineWidth = 5;
            ACCESS.dbCtx.strokeStyle = ACCESS.itemColor;

            for (var i = 0; i < ACCESS.icon.code.length; i++) {
                if (i == 0) {
                    ACCESS.dbCtx.moveTo((ACCESS.icon.code[i][0] + 1) * 200, (ACCESS.icon.code[i][1] + 1) * 200);
                } else {
                    ACCESS.dbCtx.lineTo((ACCESS.icon.code[i][0] + 1) * 200, (ACCESS.icon.code[i][1] + 1) * 200);
                }
            }

            ACCESS.dbCtx.lineTo(ACCESS.icon.x, ACCESS.icon.y);
            ACCESS.dbCtx.stroke();
        }

        ACCESS.dbCtx.lineWidth = 1;
        ACCESS.dbCtx.strokeStyle = ACCESS.structColor;

        ACCESS.dbCtx.beginPath();
        ACCESS.dbCtx.moveTo(ACCESS.icon.x + 12 * Math.cos(ACCESS.icon.rot), ACCESS.icon.y + 12 * Math.sin(ACCESS.icon.rot));
        ACCESS.dbCtx.lineTo(ACCESS.icon.x + 8 * Math.cos(ACCESS.icon.rot + Math.PI * 0.7), ACCESS.icon.y + 8 * Math.sin(ACCESS.icon.rot + Math.PI * 0.7));
        ACCESS.dbCtx.lineTo(ACCESS.icon.x + 8 * Math.cos(ACCESS.icon.rot - Math.PI * 0.7), ACCESS.icon.y + 8 * Math.sin(ACCESS.icon.rot - Math.PI * 0.7));
        ACCESS.dbCtx.closePath();
        ACCESS.dbCtx.stroke();

        // Propulsion
        while (ACCESS.icon.prop.length > 0 && ACCESS.icon.prop[0].idx > 50) {
            ACCESS.icon.prop.shift();
        }
        for (var i = 0 ; i < ACCESS.icon.prop.length; i++) {
            ACCESS.dbCtx.lineWidth = 1;
            ACCESS.dbCtx.strokeStyle = ACCESS.itemColor;
            ACCESS.dbCtx.strokeRect(ACCESS.icon.prop[i].x, ACCESS.icon.prop[i].y, 1, 1);
            
            ACCESS.icon.prop[i].x += ACCESS.icon.prop[i].sx;
            ACCESS.icon.prop[i].y += ACCESS.icon.prop[i].sy;
            ACCESS.icon.prop[i].idx++;
        }

    } else {
        if (ACCESS.icon.expl === null) { 
            ACCESS.icon.expl = [];
            for (var i = 0; i < 60; i++) {
                var particle = {};
                particle.x = ACCESS.icon.x;
                particle.y = ACCESS.icon.y;
                var speed = 3 * Math.random() + 0.1;
                var dir = Math.random() * 2 * Math.PI;
                particle.sx = speed * Math.cos(dir);
                particle.sy = speed * Math.sin(dir);
                ACCESS.icon.expl.push(particle);
            }
        }

        ACCESS.dbCtx.fillStyle = ACCESS.structColor;
        ACCESS.dbCtx.lineWidth = 1;
        for (var i = 0; i < ACCESS.icon.expl.length; i++) {
            ACCESS.icon.expl[i].x += ACCESS.icon.expl[i].sx;
            ACCESS.icon.expl[i].y += ACCESS.icon.expl[i].sy;
            ACCESS.dbCtx.fillRect(ACCESS.icon.expl[i].x, ACCESS.icon.expl[i].y, 3, 3);
        }

        ACCESS.icon.destroy++;
    }

    // Crash
    if (ACCESS.icon.destroy > 50) {
        document.getElementById('failure').style.display = 'block';
    }

    // Render
    ACCESS.ctx.clearRect(0, 0, ACCESS.canvas.width, ACCESS.canvas.height);
    ACCESS.ctx.drawImage(ACCESS.db, 0, 0);

    // Loop
    requestAnimationFrame(ACCESS.loop);
}


window.addEventListener('load', ACCESS.start, false);