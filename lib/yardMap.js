"use strict";

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function getWindowSize() {
  var width = window.innerWidth;
  var height = window.innerHeight;
  return {
    width: width,
    height: height
  };
}

var mapConfig = {
  siteWidth: 40,
  //每个位置的宽
  siteHeight: 40,
  //每个位置的高
  siteMargin: 8,
  //每个位置的间距
  offset: {
    dx: 0,
    dy: 34
  },
  padding: {
    top: 0,
    bottom: 0,
    left: 24,
    right: 24
  },
  radarSeatWidth: 4,
  radarSeatHeight: 4,
  radarSeatMargin: 2,
  siteDistance: 45 // 获得dpr

};

var getPixelRatio = function getPixelRatio() {
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var devicePixelRatio = window.devicePixelRatio || 1;
  var canvasPixelRatio = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1;
  var dpr = devicePixelRatio / canvasPixelRatio;
  canvas = null;
  ctx = null;
  return dpr > 2 ? 2 : Math.round(dpr);
};

var Site = function Site() {
  _classCallCheck(this, Site);
};

var YardMap =
/*#__PURE__*/
function () {
  function YardMap(options) {
    var _this = this;

    _classCallCheck(this, YardMap);

    _defineProperty(this, "handleMapTap", function (e) {
      e.preventDefault();

      var _dx = e.center.x - _this.mapOffset.left - _this.dx,
          _dy = e.center.y - _this.mapOffset.top - _this.dy,
          _scaleX = _dx / _this.scale,
          _scaleY = _dy / _this.scale;

      _this.scale !== 1 && _this.setMatrix({
        scale: 1,
        dx: _this.dx + Math.round(_dx - _scaleX),
        dy: _this.dy + Math.round(_dy - _scaleY)
      });

      _this.checkBoundary();

      _this.updateMap();
    });

    this.mapConfig = $.extend({}, mapConfig, options);
    this.mapCanvas = document.querySelector('.canvas-map');
    this.mapCtx = this.mapCanvas.getContext('2d');
    this.xindex = $('.x-index');
    this.yindex = $('.y-index');
    this.indexItems = $('#index-items').html();
    this.siteWidth = this.mapConfig.siteWidth; //每个位置的宽

    this.siteHeight = this.mapConfig.siteHeight; //每个位置的高

    this.siteMargin = this.mapConfig.siteMargin; //每个位置的间距

    this.data = this.mapConfig.data || {};
    this.dy = 0; //地图y轴位移

    this.dx = 0; //地图x轴位移

    this.scale = 1; //初始缩放

    this.maxScale = 1; //最大缩放

    this.dpr = getPixelRatio(); //地图像素比

    this.viewWidth = window.innerWidth; //整个视图宽

    this.viewHeight = window.innerHeight; //整个视图高

    this.mapData = this.getMapData(this.data);
    this.mapWidth = this.mapData.mapWidth; //地图的宽度

    this.mapHeight = this.mapData.mapHeight; //地图的高度

    var mapOffset = $(this.mapCanvas).offset();
    this.mapOffset = _objectSpread({}, mapOffset);
    this.initScale();
    this.createIndex();
    this.bindEvent();
    this.init();
  } //初始化


  _createClass(YardMap, [{
    key: "init",
    value: function init() {
      this.initSize();
      this.setMatrix({
        dx: Math.round((this.viewWidth - this.mapWidth * this.scale) / 2),
        dy: this.mapConfig.offset.dy
      });
      this.renderMap(this.mapCtx);
    }
  }, {
    key: "initSize",
    value: function initSize() {
      this.mapCanvas.width = this.viewWidth * this.dpr;
      this.mapCanvas.height = this.viewHeight * this.dpr;
      this.mapCanvas.style.width = "".concat(this.viewWidth, "px");
      this.mapCanvas.style.height = "".concat(this.viewHeight, "px");
    } // 创建x,y轴坐标

  }, {
    key: "createIndex",
    value: function createIndex() {
      this.xIndex = {
        columns: this.getIndexName('x'),
        columnWidth: this.mapConfig.siteWidth + this.mapConfig.siteMargin // x轴宽

      }; //x轴索引

      this.yIndex = {
        rows: this.getIndexName('y'),
        rowHeight: this.mapConfig.siteHeight + this.mapConfig.siteMargin // y轴高

      }; //y轴索引

      var yHtml = _.template(this.indexItems)({
        data: this.yIndex,
        scale: this.scale
      });

      var xHtml = _.template(this.indexItems)({
        data: this.xIndex,
        scale: this.scale
      });

      this.yindex.html(yHtml);
      this.xindex.css({
        'width': this.mapWidth,
        'left': Math.round((this.viewWidth - this.mapWidth * this.scale) / 2) + 20 * this.scale
      }).html(xHtml);
    } //解析地图的数据

  }, {
    key: "getMapData",
    value: function getMapData(data) {
      var maxColumn = data.maxColumn,
          maxRow = data.maxRow,
          minColumn = data.minColumn,
          minRow = data.minRow,
          site = data.site;
      var _this$mapConfig = this.mapConfig,
          siteWidth = _this$mapConfig.siteWidth,
          siteMargin = _this$mapConfig.siteMargin,
          siteHeight = _this$mapConfig.siteHeight,
          padding = _this$mapConfig.padding;
      var mapWidth = siteWidth * maxColumn + siteMargin * (maxColumn - 1) + padding.left + padding.right; //地图的宽度 = 位置的宽度*列数 + 位置间距*（列数-1）+ 左padding + 右padding

      var mapHeight = siteHeight * maxRow + siteMargin * (maxRow - 1) + padding.top;
      return {
        maxColumn: maxColumn,
        minColumn: minColumn,
        maxRow: maxRow,
        minRow: minRow,
        mapWidth: mapWidth,
        mapHeight: mapHeight,
        site: site.map(function (item) {
          var column = item.column,
              row = item.row;
          var vx = (siteWidth + siteMargin) * (column - 1) + padding.left;
          var vy = (siteHeight + siteMargin) * (row - 1) + padding.top;
          return _objectSpread({}, item, {
            vx: vx,
            vy: vy
          });
        })
      };
    } //得到索引

  }, {
    key: "getIndexName",
    value: function getIndexName(dir) {
      var _this$mapData = this.mapData,
          minColumn = _this$mapData.minColumn,
          maxColumn = _this$mapData.maxColumn,
          minRow = _this$mapData.minRow,
          maxRow = _this$mapData.maxRow;
      var indexes = [];
      var indexMap = {
        'x': {
          min: +minColumn,
          max: +maxColumn,
          group: _.groupBy(this.mapData.site, function (item) {
            return item.column;
          })
        },
        'y': {
          min: +minRow,
          max: +maxRow,
          group: _.groupBy(this.mapData.site, function (item) {
            return item.row;
          })
        }
      };

      for (var index = indexMap[dir].min; index < indexMap[dir].max + 1; index++) {
        indexes.push({
          index: index
        });
        /* if(indexMap[dir].group[index]) {
          indexes.push({ index: indexMap[dir].group[index][0][`${dir === 'x' ? 'columnName' : 'rowName'}`] })
        } else {
          indexes.push({ index: '' });
        } */
      }

      return indexes;
      /* this.yIndex = {
        rows,
        rowHeight: this.mapConfig.siteHeight + this.mapConfig.siteMargin // y轴高
      }
      this.xIndex = {
        columns,
        columnWidth: this.mapConfig.siteWidth + this.mapConfig.siteMargin // x轴宽
      } */
    } //初始化缩放

  }, {
    key: "initScale",
    value: function initScale() {
      var scale = Math.min((this.viewHeight - this.mapConfig.offset.dy) / this.mapHeight, (this.viewWidth - this.mapConfig.offset.dx) / this.mapWidth);

      if (this.viewHeight >= this.mapHeight && this.viewWidth >= this.mapWidth) {
        scale = 1;
      }

      this.minScale = scale;
      this.scale = scale;
    } //绑定手势

  }, {
    key: "bindEvent",
    value: function bindEvent() {
      var _this2 = this;

      this.mc = new Hammer.Manager(this.mapCanvas);
      this.mc.add(new Hammer.Pan());
      this.mc.add(new Hammer.Tap());
      this.mc.add(new Hammer.Pinch());
      this.mc.on('panstart', function () {
        _this2.startDy = _this2.dy;
        _this2.startDx = _this2.dx;
      });
      this.mc.on('panmove', function (e) {
        _this2.setMatrix({
          scale: _this2.scale,
          dx: _this2.startDx + e.deltaX,
          dy: _this2.startDy + e.deltaY
        });

        _this2.updateMap();
      });
      this.mc.on('panend', function () {
        _this2.checkBoundary();

        _this2.updateMap();
      });
      this.mc.on('pinchstart', function () {
        //禁止拖拽
        _this2.mc.get('pan').set({
          enable: false
        });
      });
      this.mc.on('pinchmove', function (e) {
        var nowScale = _this2.scale * e.scale;
        nowScale <= _this2.minScale && (nowScale = _this2.minScale); //限制最小缩放为初始

        nowScale >= _this2.maxScale && (nowScale = _this2.maxScale); //限制最大缩放为1

        var xCenter = e.center.x - _this2.mapOffset.left,
            // 获得x中心点
        yCenter = e.center.x - _this2.mapOffset.top,
            // 获得y轴中心点
        initXcenter = parseInt(xCenter / _this2.scale, 10),
            initYcenter = parseInt(yCenter / _this2.scale, 10),
            scaleXcenter = parseInt(xCenter / nowScale, 10),
            scaleYcenter = parseInt(yCenter / nowScale, 10);

        _this2.setMatrix({
          scale: nowScale,
          dx: _this2.dx - (initXcenter - scaleXcenter),
          dy: _this2.dy - (initYcenter - scaleYcenter)
        });

        _this2.checkBoundary();

        _this2.updateMap();
      });
      this.mc.on('pinchend', function () {
        _this2.mc.get('pan').set({
          enable: true
        });
      });
      this.mc.on('tap', this.handleMapTap);
    }
  }, {
    key: "checkBoundary",
    //检测边界
    value: function checkBoundary() {
      var thisDx = this.dx,
          thisDy = this.dy,
          thisScale = this.scale,
          thisViewWidth = this.viewWidth,
          thisViewHeight = this.viewHeight,
          thisScaleMapWidth = this.mapWidth * thisScale,
          thisScaleMapHeight = this.mapHeight * thisScale;

      if (thisViewWidth >= thisScaleMapWidth) {
        var centerDx = (thisViewWidth - thisScaleMapWidth) / 2;
        thisDx !== centerDx && (thisDx = centerDx);
      } else {
        thisDx > 0 && (thisDx = 0);
        thisDx < -(thisScaleMapWidth - thisViewWidth) && (thisDx = -(thisScaleMapWidth - thisViewWidth));
      }

      if (thisViewHeight - this.mapConfig.offset.dy >= thisScaleMapHeight) {
        thisDy = this.mapConfig.offset.dy;
      } else {
        thisDy > this.mapConfig.offset.dy && (thisDy = this.mapConfig.offset.dy);
        thisDy < thisViewHeight - thisScaleMapHeight && (thisDy = thisViewHeight - thisScaleMapHeight);
      }

      this.dx = thisDx;
      this.dy = thisDy;
    } //设置地图的位移与缩放

  }, {
    key: "setMatrix",
    value: function setMatrix(transform) {
      var dy = transform.dy,
          dx = transform.dx,
          scale = transform.scale;
      dy && (this.dy = dy);
      dx && (this.dx = dx);
      scale && (this.scale = scale);
    } //渲染地图

  }, {
    key: "renderMap",
    value: function renderMap(ctx) {
      var _this3 = this;

      if (ctx) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.viewWidth * this.dpr, this.viewHeight * this.dpr); //清空画布

        ctx.restore();
        ctx.setTransform(this.scale * this.dpr, 0, 0, this.scale * this.dpr, this.dx * this.dpr, this.dy * this.dpr); //设置画布的缩放与位移

        this.mapData.site.forEach(function (item) {
          _this3.renderSite(ctx, item);
        });
        ctx.save();
      }
    } //更新整个map 包括坐标轴等

  }, {
    key: "updateMap",
    value: function updateMap() {
      this.renderMap(this.mapCtx);
      this.updateIndex();
    } //更新索引

  }, {
    key: "updateIndex",
    value: function updateIndex() {
      var distanceX = this.dx;
      var distanceY = this.dy;
      var scale = this.scale;
      this.yindex.css('transform', "translate3d(0, ".concat(distanceY - this.mapConfig.offset.dy, "px,0)"));
      this.yindex.find('ul').css('line-height', "".concat((this.siteHeight + this.siteMargin) * scale, "px"));
      this.xindex.css({
        'transform': "translate3d(".concat(distanceX - this.mapConfig.offset.dx, "px, 0 ,0)"),
        'left': 19 * scale
      });
      this.xindex.find('ul>li').css('width', (this.siteWidth + this.siteMargin) * scale);
    } //渲染贝位

  }, {
    key: "renderSite",
    value: function renderSite(ctx, site) {
      ctx.fillStyle = site.status === '1' ? '#fff' : '#fa541c';
      ctx.fillRect(site.vx, site.vy, this.mapConfig.siteWidth, this.mapConfig.siteHeight);
    }
  }]);

  return YardMap;
}();