(function () {
    "use strict";
    var Game = function () {           //singelton function
        this.maxtick = 3;
        this.maxlives = 7;
        this.lives = 0;
        this.tickcount = 0;
    };
    Game.__name__ = true;
    Game.prototype = {
        initLevel: function (level) {
            this.lives = this.maxlives;
            this.tickcount = this.maxtick;
            this.currentlevel = level;
            this.readytostart = true;
            this.currentscore = 0;
        },
        update: function () {},
        start: function () {
            this.initLevel(this.currentlevel);
        },
        swapBit: function (row, place, new_value) {
            var swaprow = this.currentlevel.rows[row];
            haxe_Log.trace(swaprow.toString(), {
                fileName: "Game.hx",
                lineNumber: 50,
                className: "Game",
                methodName: "swapBit"
            });
            swaprow.bits[7 - place] = new_value;
            var currentsteps = swaprow.getStepsToRight();
            haxe_Log.trace(currentsteps.toString(), {
                fileName: "Game.hx",
                lineNumber: 54,
                className: "Game",
                methodName: "swapBit"
            });
            if (currentsteps.length <= 0) {
                swaprow.complete = true;
                Main.rowSolved(row);
            }
            return true;
        },
        tick: function () {
            if (this.tickcount > this.maxtick) {
                this.tickcount = 0;
                this.lives--;
                if (this.lives < 0) {
                    Main.gameover();
                } else {
                    Main.moveBits(this.lives / this.maxlives);
                }
            }
            this.tickcount++;
        },
        rowRemoved: function (row) {
            if (this.lives + 1 >= this.maxlives) {
                this.lives = this.maxlives - 1;
            } else {
                this.lives++;
            }
            this.currentscore += row.decimal;
            Main.updatescore(this.currentscore);
        },
        gameover: function () {},
        levelUp: function () {}
    };
    var GameRow = function () {
        this.decimalString = ["", "", ""];
        this.globalIndex = 0;
        this.numeric = false;
        this.complete = false;
        this.bits = [0, 0, 0, 0, 0, 0, 0, 0];
        this.decimal = 0;
    };
    GameRow.__name__ = true;
    GameRow.intToString = function (num, base) { //9
        if (base == null) {
            base = 2;
        }
        var result_b = "";
        var maxPow = 0;
        while ((Math.pow(base, maxPow) | 0) <= num) ++maxPow; //1,2,4,8 4
        var i = maxPow - 1;//3
        while (i >= 0) {
            var basePow = Math.pow(base, i);//1,2,4,8
            var pow = Math.floor(num / basePow); //9,4,0,0
            result_b += Std.string("0123456789ABCDEFGHIJKLMNOPQRSTUVW".charAt(pow | 0)); //9400
            num -= pow * basePow | 0; //9,1,0,0
            --i;
        }
        var r = result_b;
        if (r.length == 0) { //4
            return "0";
        } else {
            return r;
        }
    };
    GameRow.intToStringBuf = function (num, base) {
        if (base == null) {
            base = 2;
        }
        var result = new StringBuf();
        var maxPow = 0;
        while ((Math.pow(base, maxPow) | 0) <= num) ++maxPow;
        var i = maxPow - 1;
        while (i >= 0) {
            var basePow = Math.pow(base, i);
            var pow = Math.floor(num / basePow);
            var x = "0123456789ABCDEFGHIJKLMNOPQRSTUVW".charAt(pow | 0);
            result.b += Std.string(x);
            num -= pow * basePow | 0;
            --i;
        }
        return result;
    };
    GameRow.prototype = {
        getStepsToRight: function () {
            var result = [];
            var str = GameRow.intToString(this.decimal);
            while (str.length < 8) str = "0" + str;
            var i = 0;
            while (str.length > i) {
                var k = str.length - 1 - i;
                var $char = str.charAt(k);
                if (Std.string(this.bits[k]) != $char) {
                    result.push(k);
                }
                ++i;
            }
            if (result.length == 0) {
                this.complete = true;
            }
            return result;
        },
        checkCorrectInput: function () {
            haxe_Log.trace("chec for correct input", {
                fileName: "GameRow.hx",
                lineNumber: 72,
                className: "GameRow",
                methodName: "checkCorrectInput",
                customParams: [GameRow.intToString(this.decimal, 10), this.decimalString.join("")]
            });
            if (this.decimalString[0] == "0") {
                this.decimalString[0] = "";
                if (this.decimalString[1] == "0") {
                    this.decimalString[1] = "";
                    if (this.decimalString[2] == "0") {
                        this.decimalString[2] = "";
                    }
                }
            }
            if (GameRow.intToString(this.decimal, 10) == this.decimalString.join("")) {
                return true;
            } else {
                return false;
            }
        },
        makeDecimal: function () {
            this.numeric = true;
            var binstr = GameRow.intToString(this.decimal, 2);
            binstr = StringTools.lpad(binstr, "0", 8);
            var _g1 = 0;
            var _g = binstr.length;
            while (_g1 < _g) {
                var l = _g1++;
                if (binstr.charAt(l) == "0") {
                    this.bits[l] = 0;
                } else {
                    this.bits[l] = 1;
                }
            }
            haxe_Log.trace(this.toString(), {
                fileName: "GameRow.hx",
                lineNumber: 169,
                className: "GameRow",
                methodName: "makeDecimal",
                customParams: [binstr]
            });
        },
        toString: function () {
            return "[GameRow decimal=" + this.decimal + " bits=" + Std.string(this.bits) + " complete=" + Std.string(this.complete) + " numeric=" + Std.string(this.numeric) + " globalIndex=" + this.globalIndex + " decimal_display=" + Std.string(this.decimal_display) + "]";
        }
    };
    var Helpers = function () {};
    Helpers.__name__ = true;
    Helpers.not = function (bit) {
        if (bit == 0) {
            return 1;
        } else {
            return 0;
        }
    };
    var LevelDesc = function (seed) {
        this.lastestFromLvUp = 8;
        this.globalLevelIndex = 0;
        this.seed = seed;
        this.rows = [];
        this.nextIndex = 0;
    };
    LevelDesc.__name__ = true;
    LevelDesc.prototype = {
        getNext: function () {
            var row = this.whatNext();
            row.globalIndex = this.nextIndex;
            this.rows.push(row);
            this.nextIndex++;
            if (this.nextIndex > this.lastestFromLvUp) {
                this.lastestFromLvUp = Math.floor(this.lastestFromLvUp * 1.5);
                this.globalLevelIndex++;
                Main.levelUp();
            }
            haxe_Log.trace(this.nextIndex, {
                fileName: "LevelDesc.hx",
                lineNumber: 45,
                className: "LevelDesc",
                methodName: "getNext",
                customParams: [row.globalIndex]
            });
            return row;
        },
        whatNext: function () {
            var row = new GameRow();
            row.decimal = Math.ceil(Math.random() * 32 + Math.pow(2, this.globalLevelIndex));
            if (Math.random() < 0.5) {
                if (this.nextIndex != 0) {
                    row.makeDecimal();
                    var _g = 0;
                    while (_g < 8) {
                        ++_g;
                        Math.random();
                    }
                }
            }
            return row;
        }
    };
    var Main = function () {};
    Main.__name__ = true;
    Main.main = function () {
        Main.main = Main;
        haxe_Log.trace("main started-------------------------", {
            fileName: "Main.hx",
            lineNumber: 39,
            className: "Main",
            methodName: "main"
        });
        var gameContainer = window.document.getElementById("gameWindowContainer");
        Main.stage = new Stage();
        Main.stage.setContainer(gameContainer);
        var refreshLayoutTimer = new haxe_Timer(300);
        refreshLayoutTimer.run = function () {
            if (Main.latestdocW != window.document.body.clientWidth) {
                Main.resizeHandler();
                Main.latestdocW = window.document.body.clientWidth;
            }
        };
        window.addEventListener("resize", Main.resizeHandler);
        Main.stage.showStartMenu();
        var startbtn = window.document.getElementById("startGameButton");
        var pausebtn = window.document.getElementById("pauseMenuButton");
        var resumebtn = window.document.getElementById("resumeGameButton");
        var endgamebtn = window.document.getElementById("endGameButton");
        var instructbtn = window.document.getElementById("instructionsButton");
        var gotitbtn = window.document.getElementById("gotItButton");
        startbtn.addEventListener("click", Main.startGame);
        pausebtn.addEventListener("click", Main.pauseGame);
        resumebtn.addEventListener("click", Main.unpausegame);
        endgamebtn.addEventListener("click", Main.endGame);
        instructbtn.addEventListener("click", Main.showHelp);
        gotitbtn.addEventListener("click", Main.gotoMainMenu);
        gameContainer.style.opacity = "1.0";
        var _g = 0;
        while (_g < 10) {
            var n = _g++;
            var numkey = window.document.getElementById("numericKey" + n);
            var curkey = ["" + n];
            haxe_Log.trace(curkey[0], {
                fileName: "Main.hx",
                lineNumber: 99,
                className: "Main",
                methodName: "main"
            });
            numkey.addEventListener("click", (function (curkey1) {
                return function () {
                    Main.numkeyClick(curkey1[0]);
                };
            })(curkey));
        }
        Main.submitkey = window.document.getElementById("numericKeyV");
        Main.deletekey = window.document.getElementById("numericKeyX");
        Main.submitkey.addEventListener("click", Main.submitNUmericValue);
        Main.deletekey.addEventListener("click", Main.clearNumericValue);
        FastClick.attach(document.body);
    };
    Main.gotoMainMenu = function (e) {
        Main.stage.showStartMenu();
    };
    Main.showHelp = function (e) {
        Main.stage.showLayer("InstructionLayer");
        var video = window.document.getElementById("videoInstructions");
        video.src = "img/instructions.gif";
    };
    Main.clearNumericValue = function (e) {
        Main.numericInput.decimalString.unshift("");
        var lst = Main.numericInput.decimalString.pop();
        Main.updateNumeric();
        if (lst == "") {
            Main.stage.hideNumKeyboard();
        }
    };
    Main.submitNUmericValue = function (e) {
        if (Main.numericInput.checkCorrectInput() == true) {
            Main.rowSolved(Main.numericInput.globalIndex);
            Main.stage.hideLayer("NumkeyboardLayer");
        }
    };
    Main.numkeyClick = function (key) {
        haxe_Log.trace("numkey clicked", {
            fileName: "Main.hx",
            lineNumber: 151,
            className: "Main",
            methodName: "numkeyClick",
            customParams: [key]
        });
        Main.numericInput.decimalString.push(key);
        Main.numericInput.decimalString.shift();
        haxe_Log.trace(Main.numericInput.decimalString.toString(), {
            fileName: "Main.hx",
            lineNumber: 169,
            className: "Main",
            methodName: "numkeyClick"
        });
        Main.updateNumeric();
    };
    Main.updateNumeric = function () {
        Main.numericInput.decimal_display.innerText = "";
        var stopErase = false;
        var _g = 0;
        while (_g < 3) {
            var n = _g++;
            if (Main.numericInput.decimalString[n] == "") {
                Main.numericInput.decimal_display.innerText += "_";
            } else if (Main.numericInput.decimalString[n] == "0") {
                if (stopErase == false) {
                    Main.numericInput.decimal_display.innerText += "_";
                } else {
                    Main.numericInput.decimal_display.innerText += "0";
                }
            } else {
                stopErase = true;
                Main.numericInput.decimal_display.innerText += Main.numericInput.decimalString[n];
            }
        }
        if (Main.numericInput.decimal_display.innerText == "000") {
            Main.numericInput.decimal_display.innerText = "___";
        }
        var binary = "00010110";
        Main.currentRow = Main.numericInput;
        if (Main.currentRow != null) {
            binary = "";
            var _g1 = 0;
            var _g11 = Main.currentRow.bits;
            while (_g1 < _g11.length) {
                var n1 = _g11[_g1];
                ++_g1;
                binary += "<span class=\"" + "diginum" + "\">" + n1 + "</span>";
            }
        }
        window.document.getElementById("numeKeyboardDisplay").innerHTML = binary + " = " + Main.numericInput.decimal_display.innerText;
        TweenLite.from(Main.numericInput.decimal_display, 0.3, {
            css: {
                color: "#ffffff"
            }
        });
        TweenLite.fromTo("#numeKeyboardDisplay", 0.4, {
            alpha: 0
        }, {
            alpha: 1
        });
    };
    Main.endGame = function (e) {
        // if (Main.warned == true) {
            Main.gameover();
        // } else {
        //     Main.warned = true;
        //     js_Browser.alert("Warning: all your progress will be lost! \n Please click 'end game' again to exit to main menu");
        // }
    };
    Main.unpausegame = function (e) {
        Main.stage.unpause();
        Main.paused = false;
    };
    Main.pauseGame = function (e) {
        Main.stage.pause();
        Main.paused = true;
    };
    Main.startGame = function () {
        var lvldata = new LevelDesc(0);
        Main.game = new Game();
        Main.game.initLevel(lvldata);
        var _g = 0;
        while (_g < 9) {
            ++_g;
            Main.stage.addNewRow(lvldata.getNext());
        }
        Main.stage.showNewGame();
    };
    Main.resizeHandler = function (e) {
        Main.stage.updateLayout();
        haxe_Log.trace("stage resized", {
            fileName: "Main.hx",
            lineNumber: 276,
            className: "Main",
            methodName: "resizeHandler"
        });
    };
    Main.tick = function () {
        if (!Main.paused) {
            Main.game.tick();
        }
    };
    Main.swapBit = function (row, place, new_value) {
        Main.game.swapBit(row, place, new_value);
    };
    Main.readyGo = function () {
        Main.ticker = new haxe_Timer(1000);
        Main.ticker.run = Main.tick;
        Main.game.tick();
    };
    Main.gameover = function () {
        Main.stage.gameover();
        Main.ticker.stop();
        var gmovrTick = new haxe_Timer(3000);
        gmovrTick.run = function () {
            Main.stage.showStartMenu();
            gmovrTick.stop();
			ak_end.click();
            window.location.reload();
        };
    };
    Main.moveBits = function (perc) {
        Main.stage.move(perc);
    };
    Main.rowSolved = function (row) {
        Main.stage.removeRow(Main.game.currentlevel.rows[row]);
    };
    Main.rowRemoved = function (row) {
        Main.game.rowRemoved(row);
        Main.stage.addNewRow(Main.game.currentlevel.getNext());
    };
    Main.updatescore = function (currentscore) {
        Main.stage.updateScore(currentscore);
    };
    Main.getNext = function () {
        return new GameRow();
    };
    Main.showInputFor = function (r) {
        Main.numericInput = r;
        window.document.getElementById("numeKeyboardDisplay").innerText = Main.numericInput.decimal_display.innerText;
        Main.updateNumeric();
    };
    Main.clearCurrentInput = function () {
        Main.numericInput = null;
    };
    Main.levelUp = function () {
        Main.stage.levelUp(Main.game.currentlevel.globalLevelIndex);
    };
    Math.__name__ = true;
    var Stage = function () {
        this.containerHeight = 0;
        this.containerWidth = 0;
        this.rowDisplayContainer = [];
        this.rowcontainers = [];
    };
    Stage.__name__ = true;
    Stage.prototype = {
        setContainer: function (gameContainer) {
            this.gameContainer = gameContainer;
            this.binfield = window.document.getElementById("binField");
            this.binMarkLine = window.document.getElementById("binMarkLine");
            this.binBits = window.document.getElementById("binBits");
            this.scorefield = window.document.getElementById("scoreNumber");
            window.document.getElementsByClassName("mainMenuLayer");
            this.updateLayout();
        },
        showLayer: function (layerId, hideOhters) {
            if (hideOhters == null) {
                hideOhters = true;
            }
            if (hideOhters != false) {
                var _g = 0;
                var _g1 = Stage.allayers;
                while (_g < _g1.length) {
                    var k = _g1[_g];
                    ++_g;
                    this.hideLayer(k);
                }
            }
            var layer = window.document.getElementsByClassName(layerId);
            var _g11 = 0;
            var _g2 = layer.length;
            while (_g11 < _g2) {
                var itm = layer.item(_g11++);
                itm.style.display = "";
                TweenLite.from(itm, 1, {
                    alpha: 0
                });
            }
        },
        hideLayer: function (layerId) {
            var layer = window.document.getElementsByClassName(layerId);
            var _g1 = 0;
            var _g = layer.length;
            while (_g1 < _g) layer.item(_g1++).style.display = "none";
        },
        showNumKeyboard: function () {
            this.showLayer("NumkeyboardLayer", false);
        },
        hideNumKeyboard: function () {
            this.hideLayer("NumkeyboardLayer");
        },
        drawDummies: function () {
            this.drawLevel(new LevelDesc(0));
        },
        drawLevel: function (level) {
            this.binBits.innerHTML = "";
            var countX = 0;
            var _g = 0;
            var _g1 = level.rows;
            while (_g < _g1.length) {
                var row = _g1[_g];
                ++_g;
                var rowscontainer = window.document.createElement("div");
                rowscontainer.id = "row_" + countX;
                rowscontainer.className = "row";
                var countY = 0;
                var _g2 = 0;
                var _g3 = row.bits;
                while (_g2 < _g3.length) {
                    var bit = _g3[_g2];
                    ++_g2;
                    var bitdiv = window.document.createElement("div");
                    var bitdiv_ulamut = window.document.createElement("div");
                    var bitdiv_digit = window.document.createElement("div");
                    bitdiv_digit.className = "digit";
                    bitdiv_ulamut.className = "ulamut";
                    if (bit == 0) {
                        bitdiv.className = "bit zero";
                        bitdiv_digit.innerText = "0";
                    } else if (bit == 1) {
                        bitdiv.className = "bit ein";
                        bitdiv_digit.innerText = "1";
                    }
                    bitdiv.appendChild(bitdiv_ulamut);
                    bitdiv.appendChild(bitdiv_digit);
                    rowscontainer.appendChild(bitdiv);
                    new StageBit(bitdiv, bitdiv_ulamut, bitdiv_digit, countX, 7 - countY);
                    ++countY;
                }
                var decimal = window.document.createElement("div");
                decimal.className = "decimal";
                decimal.innerText = row.decimal + "";
                this.rowcontainers.push(rowscontainer);
                rowscontainer.appendChild(decimal);
                this.binBits.appendChild(rowscontainer);
                ++countX;
            }
            this.updateLayout();
            window.console.log(level);
        },
        addNewRow: function (row) {
            var _gthis = this;
            var rowIndex = row.globalIndex;
            var rowscontainer = window.document.createElement("div");
            rowscontainer.id = "row_" + rowIndex;
            rowscontainer.className = "row";
            var countY = 0;
            var _g = 0;
            var _g1 = row.bits;
            while (_g < _g1.length) {
                var bit = _g1[_g];
                ++_g;
                var bitdiv = window.document.createElement("div");
                var bitdiv_ulamut = window.document.createElement("div");
                var bitdiv_digit = window.document.createElement("div");
                bitdiv_digit.className = "digit";
                bitdiv_ulamut.className = "ulamut";
                if (bit == 0) {
                    bitdiv.className = "bit zero";
                    bitdiv_digit.innerText = "0";
                } else if (bit == 1) {
                    bitdiv.className = "bit ein";
                    bitdiv_digit.innerText = "1";
                }
                if (row.numeric) {
                    bitdiv.className += "num";
                }
                bitdiv.appendChild(bitdiv_ulamut);
                bitdiv.appendChild(bitdiv_digit);
                rowscontainer.appendChild(bitdiv);
                new StageBit(bitdiv, bitdiv_ulamut, bitdiv_digit, rowIndex, 7 - countY, row.numeric);
                ++countY;
            }
            var decimal = window.document.createElement("div");
            decimal.className = "decimal";
            decimal.innerText = row.decimal + "";
            if (row.numeric) {
                decimal.innerText = "???";
                decimal.className = "decimalnum";
                rowscontainer.addEventListener("click", function () {
                    _gthis.numRowClick(row);
                    haxe_Log.trace("click on", {
                        fileName: "Stage.hx",
                        lineNumber: 276,
                        className: "Stage",
                        methodName: "addNewRow",
                        customParams: [row]
                    });
                    decimal.innerText = "___";
                });
            }
            this.rowcontainers.push(rowscontainer);
            rowscontainer.appendChild(decimal);
            this.binBits.appendChild(rowscontainer);
            ++rowIndex;
            row.decimal_display = decimal;
            this.rowDisplayContainer.push(row);
        },
        numRowClick: function (r) {
            this.showLayer("NumkeyboardLayer", false);
            var doTween = null;
            doTween = function () {
                TweenLite.from(r.decimal_display, 0.5, {
                    css: {
                        color: "#ff0000"
                    },
                    onComplete: doTween
                });
            };
            doTween();
            Main.showInputFor(r);
        },
        updateLayout: function () {
            var rect = this.gameContainer.getBoundingClientRect();
            if (rect.width == this.containerWidth && rect.height == this.containerHeight) {
                return false;
            }
            this.binffieldRect = this.binfield.getBoundingClientRect();
            this.binfield.style.height = this.binffieldRect.width + "px";
            this.binffieldRect = this.binfield.getBoundingClientRect();
            this.binMarkLine.style.fontSize = this.binffieldRect.width / 28 + "px";
            this.binBits.style.fontSize = this.binffieldRect.width / 14 + "px";
            return true;
        },
        showStartMenu: function () {
            this.showLayer("mainMenuLayer");
            var letrs = window.document.getElementsByClassName("logoLetter");
            var _g1 = 0;
            var _g = letrs.length;
            while (_g1 < _g) {
                var i = _g1++;
                TweenLite.from(letrs.item(i), 1, {
                    y: -150,
                    delay: 0.1 * i,
                    ease: Bounce.easeOut
                });
            }
        },
        showNewGame: function () {
            this.showLayer("gameLayer");
            this.updateLayout();
            TweenLite.to(this.binMarkLine, 3, {
                y: this.binffieldRect.height,
                onComplete: $bind(this, this.readyGo)
            });
            TweenLite.set(this.binBits, {
                y: this.binffieldRect.height
            });
        },
        readyGo: function () {
            Main.readyGo();
        },
        pause: function () {
            this.showLayer("pauseLayer");
        },
        unpause: function () {
            this.showLayer("gameLayer");
            this.updateLayout();
        },
        move: function (perc) {
            TweenLite.to([this.binBits, this.binMarkLine], 1, {
                y: this.binffieldRect.height * perc,
                ease: Power4.easeInOut
            });
        },
        gameover: function () {
            this.showLayer("gameOverLayer");
        },
        removeRow: function (rowr) {
            var row = rowr.globalIndex;
            TweenLite.to(this.rowcontainers[row], 0.5, {
                alpha: 0.7,
                onComplete: $bind(this, this.addLife),
                onCompleteParams: [this.rowcontainers[row]]
            });
            var bitdivs = [];
            var _g = 0;
            while (_g < 8) {
                var n = _g++;
                var bitdiv = window.document.getElementById("bitdiv_" + row + "_" + n);
                bitdiv.style.pointerEvents = "none";
                bitdivs.push(bitdiv);
                TweenLite.killTweensOf(bitdiv);
                TweenLite.to(bitdiv, 0.5, {
                    alpha: 0,
                    rotation: Math.random() * 360,
                    scaleX: 0,
                    scaleY: 0,
                    delay: n * 0.1
                });
            }
            this.rowcontainers[row].style.pointerEvents = "none";
            Main.rowRemoved(rowr);
        },
        addLife: function (row) {
            TweenLite.to(row, 1, {
                css: {
                    height: 0
                },
                onComplete: $bind(this, this.removeCompl),
                onCompleteParams: [row],
                ease: Bounce.easeOut
            });
        },
        removeCompl: function (row) {
            row.style.display = "none";
        },
        updateScore: function (currentscore) {
            this.scorefield.innerText = "" + currentscore;
            TweenLite.from(this.scorefield, 0.5, {
                css: {
                    color: "#FFFFFF"
                },
                scaleX: 1.2,
                scaleY: 1.2
            });
        },
        levelUp: function (globalLevelIndex) {
            window.document.getElementById("levelNumber").innerText = globalLevelIndex + "";
        }
    };
    var StageBit = function (bitdiv, bitdiv_ulamut, bitdiv_digit, row, place, numeric) {
        if (numeric == null) {
            numeric = false;
        }
        this.numeric = numeric;
        this.bitdiv = bitdiv;
        this.bitdiv_ulamut = bitdiv_ulamut;
        this.bitdiv_digit = bitdiv_digit;
        this.row = row;
        this.place = place;
        this.bitdiv.id = "bitdiv_" + row + "_" + place;
        bitdiv.addEventListener("click", $bind(this, this.clickList));
    };
    StageBit.__name__ = true;
    StageBit.prototype = {
        cleanUp: function () {
            this.bitdiv.removeEventListener("click", $bind(this, this.clickList));
        },
        clickList: function (e) {
            e.preventDefault();
            if (this.numeric == true) {
                return false;
            }
            window.console.log(this.row, this.place, "click");
            TweenLite.to(this.bitdiv, 0.1, {
                scaleX: 0.5,
                scaleY: 1.1,
                onComplete: $bind(this, this.animationJoint),
                ease: Back.easeIn
            });
            return true;
        },
        animationJoint: function () {
            this.swapBits();
            TweenLite.to(this.bitdiv, 0.5, {
                scaleX: 1,
                scaleY: 1,
                ease: Elastic.easeOut
            });
        },
        swapBits: function () {
            if (this.bitdiv_digit.innerText == "0") {
                this.bitdiv_digit.innerText = "1";
                this.bitdiv.className = "bit ein";
                Main.swapBit(this.row, this.place, 1);
            } else {
                this.bitdiv_digit.innerText = "0";
                this.bitdiv.className = "bit zero";
                Main.swapBit(this.row, this.place, 0);
            }
            if (this.numeric == true) {
                this.bitdiv.className += "num";
            }
        },
        explode: function () {}
    };
    var Std = function () {};
    Std.__name__ = true;
    Std.string = function (s) { //9,4,0,0
        return js_Boot.__string_rec(s, "");
    };
    var StringBuf = function () {
        this.b = "";
    };
    StringBuf.__name__ = true;
    var StringTools = function () {};
    StringTools.__name__ = true;
    StringTools.lpad = function (s, c, l) {
        if (c.length <= 0) {
            return s;
        }
        while (s.length < l) s = c + s;
        return s;
    };
    var haxe_Log = function () {};
    haxe_Log.__name__ = true;
    haxe_Log.trace = function (v, infos) {
        js_Boot.__trace(v, infos);
    };
    var haxe_Timer = function (time_ms) {
        var me = this;
        this.id = setInterval(function () {
            me.run();
        }, time_ms);
    };
    haxe_Timer.__name__ = true;
    haxe_Timer.prototype = {
        stop: function () {
            if (this.id == null) {
                return;
            }
            clearInterval(this.id);
            this.id = null;
        },
        run: function () {}
    };
    var js_Boot = function () {};
    js_Boot.__name__ = true;
    js_Boot.__unhtml = function (s) {
        return s.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;");
    };
    js_Boot.__trace = function (v, i) {
        var msg = i != null ? i.fileName + ":" + i.lineNumber + ": " : "";
        msg += js_Boot.__string_rec(v, "");
        if (i != null && i.customParams != null) {
            var _g = 0;
            var _g1 = i.customParams;
            while (_g < _g1.length) {
                var v1 = _g1[_g];
                ++_g;
                msg += "," + js_Boot.__string_rec(v1, "");
            }
        }
        var d;
        var tmp;
        if (typeof (document) != "undefined") {
            d = document.getElementById("haxe:trace");
            tmp = d != null;
        } else {
            tmp = false;
        }
        if (tmp) {
            d.innerHTML += js_Boot.__unhtml(msg) + "<br/>";
        } else if (typeof console != "undefined" && console.log != null) {
            console.log(msg);
        }
    };
    js_Boot.__string_rec = function (o, s) { //9,4,0,0 ""
        if (o == null) {
            return "null";
        }
        if (s.length >= 5) { //4
            return "<...>";
        }
        var t = typeof (o);
        if (t == "function" && (o.__name__ || o.__ename__)) {
            t = "object";
        }
        switch (t) {
            case "function":
                return "<function>";
            case "object":
                if (o instanceof Array) {
                    if (o.__enum__) {
                        if (o.length == 2) {
                            return o[0];
                        }
                        var str = o[0] + "(";
                        s += "\t";
                        var _g1 = 2;
                        var _g = o.length;
                        while (_g1 < _g) {
                            var i = _g1++;
                            if (i != 2) {
                                str += "," + js_Boot.__string_rec(o[i], s);
                            } else {
                                str += js_Boot.__string_rec(o[i], s);
                            }
                        }
                        return str + ")";
                    }
                    var l = o.length;
                    var i1;
                    var str1 = "[";
                    s += "\t";
                    var _g11 = 0;
                    var _g2 = l;
                    while (_g11 < _g2) {
                        var i2 = _g11++;
                        str1 += (i2 > 0 ? "," : "") + js_Boot.__string_rec(o[i2], s);
                    }
                    str1 += "]";
                    return str1;
                }
                var tostr;
                try {
                    tostr = o.toString;
                } catch (e) {
                    return "???";
                }
                if (tostr != null && tostr != Object.toString && typeof (tostr) == "function") {
                    var s2 = o.toString();
                    if (s2 != "[object Object]") {
                        return s2;
                    }
                }
                var k = null;
                var str2 = "{\n";
                s += "\t";
                var hasp = o.hasOwnProperty != null;
                for (var k in o) {
                    if (hasp && !o.hasOwnProperty(k)) {
                        continue;
                    }
                    if (k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__" || k == "__properties__") {
                        continue;
                    }
                    if (str2.length != 2) {
                        str2 += ", \n";
                    }
                    str2 += s + k + " : " + js_Boot.__string_rec(o[k], s);
                }
                s = s.substring(1);
                str2 += "\n" + s + "}";
                return str2;
            case "string":
                return o;
            default:
                return String(o);
        }
    };
    var js_Browser = function () {};
    js_Browser.__name__ = true;
    js_Browser.alert = function (v) {
        window.alert(js_Boot.__string_rec(v, ""));
    };
    var $_, $fid = 0;

    function $bind(o, m) {
        if (m == null) return null;
        if (m.__id__ == null) m.__id__ = $fid++;
        var f;
        if (o.hx__closures__ == null) o.hx__closures__ = {};
        else f = o.hx__closures__[m.__id__];
        if (f == null) {
            f = function () {
                return f.method.apply(f.scope, arguments);
            };
            f.scope = o;
            f.method = m;
            o.hx__closures__[m.__id__] = f;
        }
        return f;
    }
    String.__name__ = true;
    Array.__name__ = true;
    Main.warned = false;
    Main.paused = false;
    Main.latestdocW = 0;
    Stage.GAME_LAYER = "gameLayer";
    Stage.MAIN_MENU_LAYER = "mainMenuLayer";
    Stage.PAUSE_LAYER = "pauseLayer";
    Stage.GAME_OVER_LAYER = "gameOverLayer";
    Stage.NUMKEY_LAYEYR = "NumkeyboardLayer";
    Stage.INSTRUCTION_LAYEYR = "InstructionLayer";
    Stage.allayers = ["gameLayer", "mainMenuLayer", "pauseLayer", "gameOverLayer", "NumkeyboardLayer", "InstructionLayer"];
    Main.main();
})();
