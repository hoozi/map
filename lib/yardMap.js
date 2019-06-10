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
  radarSiteWidth: 4,
  radarSiteHeight: 4,
  radarSiteMargin: 2,
  siteSelectedColor: '#389e0d',
  siteColor: '#fff',
  siteCtnColor: '#fa541c' // 获得dpr

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

      var centerX = e.center.x - _this.mapOffset.left - _this.dx,
          centerY = e.center.y - _this.mapOffset.top - _this.dy,
          scaleCenterX = centerX / _this.scale,
          scaleCenterY = centerY / _this.scale,
          tapedSite = _this.getTapedSite(scaleCenterX, scaleCenterY)[0];

      if (_this.scale !== 1) {
        _this.setMatrix({
          scale: 1,
          dx: _this.dx + Math.round(centerX - scaleCenterX),
          dy: _this.dy + Math.round(centerY - scaleCenterY)
        });

        _this.checkBoundary();

        _this.renderMap(_this.mapCtx);

        _this.updateRadar();
      }

      _this.showRadar();

      _this.updateIndex();

      if (tapedSite) {
        _this.selectSeats(tapedSite);
      }
    });

    this.mapConfig = $.extend({}, mapConfig, options);
    this.mapCanvas = document.querySelector('.canvas-map');
    this.mapCtx = this.mapCanvas.getContext('2d');
    this.xindex = $('.x-index');
    this.yindex = $('.y-index');
    this.indexItems = $('#index-items').html();
    this.radarElement = document.querySelector('.radar');
    this.radarCanvas = document.querySelector('.canvas-radar');
    this.radarCtx = this.radarCanvas.getContext('2d');
    this.radarFrame = document.querySelector('.radar-frame');
    this.siteWidth = this.mapConfig.siteWidth; //每个位置的宽

    this.siteHeight = this.mapConfig.siteHeight; //每个位置的高

    this.siteMargin = this.mapConfig.siteMargin; //每个位置的间距

    this.viewWidth = this.mapConfig.viewWidth || window.innerWidth; //整个视图宽

    this.viewHeight = this.mapConfig.viewHeight || window.innerHeight; //整个视图高

    this.data = this.mapConfig.data || {};
    this.maxRadarWidth = 0.5 * this.viewWidth;
    this.dy = 0; //地图y轴位移

    this.dx = 0; //地图x轴位移

    this.scale = 1; //初始缩放

    this.maxScale = 1; //最大缩放

    this.radarScale = 1; //雷达图初始缩放

    this.dpr = getPixelRatio(); //地图像素比

    this.mapData = this.getMapData(this.data);
    this.mapWidth = this.mapData.mapWidth; //地图的宽度

    this.mapHeight = this.mapData.mapHeight; //地图的高度

    this.radarWidth = this.mapData.radarWidth; //雷达宽度

    this.radarHeight = this.mapData.radarHeight; //雷达高度

    var mapOffset = $(this.mapCanvas).offset();
    this.mapOffset = _objectSpread({}, mapOffset);
    this.selectedSites = []; // 选中的位置

    this.selectedPrevSite = {};
    this.initScale();
    this.createIndex();
    this.bindEvent();
    this.init();
  } //初始化


  _createClass(YardMap, [{
    key: "init",
    value: function init() {
      this.initSize();
      this.initRadar();
      this.setMatrix({
        dx: Math.round((this.viewWidth - this.mapWidth * this.scale) / 2),
        dy: this.mapConfig.offset.dy
      });
      this.renderMap(this.mapCtx);
      this.renderRadar(this.radarCtx);
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
          padding = _this$mapConfig.padding,
          radarSiteWidth = _this$mapConfig.radarSiteWidth,
          radarSiteHeight = _this$mapConfig.radarSiteHeight,
          radarSiteMargin = _this$mapConfig.radarSiteMargin;
      var mapWidth = siteWidth * maxColumn + siteMargin * (maxColumn - 1) + padding.left + padding.right; //地图的宽度 = 位置的宽度*列数 + 位置间距*（列数-1）+ 左padding + 右padding

      var mapHeight = (siteHeight + siteMargin) * maxRow + padding.top;
      var radarWidth = radarSiteWidth * maxColumn + radarSiteMargin * (+maxColumn + 1);
      var radarHeight = (radarSiteHeight + radarSiteMargin) * maxRow;
      return {
        maxColumn: maxColumn,
        minColumn: minColumn,
        maxRow: maxRow,
        minRow: minRow,
        mapWidth: mapWidth,
        mapHeight: mapHeight,
        radarWidth: radarWidth,
        radarHeight: radarHeight,
        site: site.map(function (item) {
          var column = item.column,
              row = item.row;
          var vx = (siteWidth + siteMargin) * (column - 1) + padding.left;
          var vy = (siteHeight + siteMargin) * (row - 1) + padding.top;
          var rx = (radarSiteWidth + radarSiteMargin) * (column - 1) + radarSiteMargin;
          var ry = (radarSiteHeight + radarSiteMargin) * (row - 1) + radarSiteMargin;
          return _objectSpread({}, item, {
            vx: vx,
            vy: vy,
            rx: rx,
            ry: ry
          });
        })
      };
    } //得到点击位置

  }, {
    key: "getTapedSite",
    value: function getTapedSite(centerX, centerY) {
      var _this2 = this;

      return this.mapData.site.filter(function (item) {
        var vx = item.vx,
            vy = item.vy;
        var toRight = vx + _this2.mapConfig.siteWidth;
        var toBottom = vy + _this2.mapConfig.siteHeight;
        return vx <= centerX && centerX <= toRight && vy <= centerY && centerY <= toBottom;
      });
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
    } //雷达图初始化

  }, {
    key: "initRadar",
    value: function initRadar() {
      if (!this.mapConfig.radar) return;
      var radarWidth = this.radarWidth,
          radarHeight = this.radarHeight;

      if (radarWidth > radarHeight && radarWidth > this.maxRadarWidth) {
        this.radarScale = this.maxRadarWidth / radarWidth;
        radarHeight *= this.radarScale;
        radarWidth = this.maxRadarWidth;
      } else {
        if (radarHeight > radarWidth && radarHeight > this.maxRadarWidth) {
          this.radarScale = this.maxRadarWidth / radarHeight;
          radarWidth *= this.radarScale;
          radarHeight = this.maxRadarWidth;
        }
      }

      this.radarWidth = radarWidth;
      this.radarHeight = radarHeight;
      this.radarCanvas.width = radarWidth * this.dpr;
      this.radarCanvas.height = radarHeight * this.dpr;
      this.radarCanvas.style.width = "".concat(this.radarWidth, "px");
      this.radarCanvas.style.height = "".concat(this.radarHeight, "px");
      this.radarCtx.scale(this.dpr * this.radarScale, this.dpr * this.radarScale);
    } //绑定手势

  }, {
    key: "bindEvent",
    value: function bindEvent() {
      var _this3 = this;

      this.mc = new Hammer.Manager(this.mapCanvas);
      this.mc.add(new Hammer.Pan());
      this.mc.add(new Hammer.Tap());
      this.mc.add(new Hammer.Pinch());
      this.mc.on('panstart', function () {
        _this3.startDy = _this3.dy;
        _this3.startDx = _this3.dx;
      });
      this.mc.on('panmove', function (e) {
        _this3.showRadar();

        _this3.setMatrix({
          scale: _this3.scale,
          dx: _this3.startDx + e.deltaX,
          dy: _this3.startDy + e.deltaY
        });

        _this3.updateMap();
      });
      this.mc.on('panend', function () {
        _this3.checkBoundary();

        _this3.updateMap();
      });
      this.mc.on('pinchstart', function () {
        //禁止拖拽
        _this3.mc.get('pan').set({
          enable: false
        });
      });
      this.mc.on('pinchmove', function (e) {
        var nowScale = _this3.scale * e.scale;
        nowScale <= _this3.minScale && (nowScale = _this3.minScale); //限制最小缩放为初始

        nowScale >= _this3.maxScale && (nowScale = _this3.maxScale); //限制最大缩放为1

        var xCenter = e.center.x - _this3.mapOffset.left,
            // 获得x中心点
        yCenter = e.center.x - _this3.mapOffset.top,
            // 获得y轴中心点
        initXcenter = parseInt(xCenter / _this3.scale, 10),
            initYcenter = parseInt(yCenter / _this3.scale, 10),
            scaleXcenter = parseInt(xCenter / nowScale, 10),
            scaleYcenter = parseInt(yCenter / nowScale, 10);

        _this3.setMatrix({
          scale: nowScale,
          dx: _this3.dx - (initXcenter - scaleXcenter),
          dy: _this3.dy - (initYcenter - scaleYcenter)
        });

        _this3.checkBoundary();

        _this3.updateMap();
      });
      this.mc.on('pinchend', function () {
        _this3.mc.get('pan').set({
          enable: true
        });
      });
      this.mc.on('tap', this.handleMapTap);
    }
  }, {
    key: "selectSeats",
    //位置选中
    value: function selectSeats(site) {
      var _this4 = this;

      var selectState = '';
      selectState = this.isSelected(site) ? 'dselected' : 'selected';

      if (selectState === 'dselected' || selectState === 'selected') {
        selectState === 'selected' ? this.addSeletedSite(site) : this.removeSelectedSite(site);
        this.renderMap(this.mapCtx);
        this.renderRadar(this.radarCtx);
        this.selectedSites.forEach(function (item) {
          _this4.renderSite(_this4.mapCtx, {
            color: _this4.getSiteColor(item),
            site: item,
            redraw: true
          });

          _this4.mapConfig.radar && _this4.renderRadarSite(_this4.radarCtx, {
            color: _this4.getSiteColor(item),
            site: item,
            redraw: true
          });
        });
        /* if(this.selectedPrevSite) {
          
        }
        if(this.selectedSites[0]) {
          this.renderSite(this.mapCtx, { 
            color: this.getSiteColor(this.selectedSites[0]), 
            site: this.selectedSites[0], 
            redraw: true 
          });
          this.mapConfig.radar && this.renderRadarSite(this.radarCtx, {
            color: this.getSiteColor(this.selectedSites[0]),
            site: this.selectedSites[0]
          })
        }
        this.selectedPrevSite = site; */

        this.mapConfig.onSelected && this.mapConfig.onSelected.call(this, this.selectedSites, selectState);
      }
    }
  }, {
    key: "isSelected",
    value: function isSelected(site) {
      return this.selectedSites.some(function (item) {
        return item.siteId === site.siteId;
      });
    }
  }, {
    key: "addSeletedSite",
    value: function addSeletedSite(site) {
      if (!this.isSelected(site)) {
        this.selectedSites[0] = site;
      }
    }
  }, {
    key: "removeSelectedSite",
    value: function removeSelectedSite(site) {
      this.selectedSites = this.selectedSites.filter(function (item) {
        return item.siteId !== site.siteId;
      });
    }
  }, {
    key: "canSelect",
    value: function canSelect(site) {
      return site.status === '1';
    } //检测边界

  }, {
    key: "checkBoundary",
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
      var _this5 = this;

      if (ctx) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.viewWidth * this.dpr, this.viewHeight * this.dpr); //清空画布

        ctx.restore();
        ctx.setTransform(this.scale * this.dpr, 0, 0, this.scale * this.dpr, this.dx * this.dpr, this.dy * this.dpr); //设置画布的缩放与位移

        this.mapData.site.forEach(function (item) {
          _this5.renderSite(ctx, {
            color: _this5.getSiteColor(item),
            site: item
          });
        });
        ctx.save();
      }
    } //渲染雷达图

  }, {
    key: "renderRadar",
    value: function renderRadar(ctx) {
      var _this6 = this;

      if (!this.mapConfig.radar) return;
      this.mapData.site.forEach(function (item) {
        _this6.renderRadarSite(ctx, {
          color: _this6.getSiteColor(item),
          site: item
        });
      });
    } //渲染雷达位置

  }, {
    key: "renderRadarSite",
    value: function renderRadarSite(ctx, renders) {
      var site = renders.site,
          color = renders.color,
          redraw = renders.redraw;
      var rx = site.rx,
          ry = site.ry;
      ctx.fillStyle = color;

      if (redraw) {
        ctx.clearRect(rx, ry, this.mapConfig.radarSiteWidth, this.mapConfig.radarSiteHeight);
        ctx.fillRect(rx, ry, this.mapConfig.radarSiteWidth, this.mapConfig.radarSiteHeight);
      } else {
        ctx.fillRect(rx, ry, this.mapConfig.radarSiteWidth, this.mapConfig.radarSiteHeight);
      }
    } //渲染贝位

  }, {
    key: "renderSite",
    value: function renderSite(ctx, renders) {
      var site = renders.site,
          color = renders.color,
          redraw = renders.redraw;
      var vx = site.vx,
          vy = site.vy;
      ctx.fillStyle = color;

      if (redraw) {
        ctx.clearRect(vx, vy, this.mapConfig.siteWidth, this.mapConfig.siteHeight);
        ctx.fillRect(vx, vy, this.mapConfig.siteWidth, this.mapConfig.siteHeight);
      } else {
        ctx.fillRect(vx, vy, this.mapConfig.siteWidth, this.mapConfig.siteHeight);
      }
    } //更新整个map 包括坐标轴等

  }, {
    key: "updateMap",
    value: function updateMap() {
      this.updateRadar();
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
    } //更新雷达

  }, {
    key: "updateRadar",
    value: function updateRadar() {
      if (!this.mapConfig.radar) return;
      var scaleMapWidth = this.mapWidth * this.scale,
          scaleMapHeight = this.mapHeight * this.scale,
          viewWidth = this.viewWidth,
          viewHeight = this.viewHeight,
          widthRatio = viewWidth / scaleMapWidth,
          heightRatio = viewHeight / scaleMapHeight,
          dx = -this.dx / scaleMapWidth * this.radarWidth,
          dy = -(this.dy - this.mapConfig.offset.dy) / scaleMapHeight * this.radarHeight;
      $(this.radarFrame).css({
        width: this.radarWidth * (widthRatio > 1 ? 1 : widthRatio),
        height: this.radarHeight * (heightRatio > 1 ? 1 : heightRatio),
        transform: "translate3d(".concat(dx, "px, ").concat(dy, "px,0)")
      });
    } //显示雷达图

  }, {
    key: "showRadar",
    value: function showRadar() {
      var _this7 = this;

      if (!this.mapConfig.radar) return;
      this.timer && clearTimeout(this.timer);
      $(this.radarElement).addClass('active');
      this.timer = setTimeout(function () {
        $(_this7.radarElement).removeClass('active');
      }, 2000);
    }
  }, {
    key: "getSiteColor",
    value: function getSiteColor(site) {
      var _this$mapConfig2 = this.mapConfig,
          siteColor = _this$mapConfig2.siteColor,
          siteCtnColor = _this$mapConfig2.siteCtnColor,
          siteSelectedColor = _this$mapConfig2.siteSelectedColor;
      return this.isSelected(site) ? siteSelectedColor : site.status == 1 ? siteColor : siteCtnColor;
    }
  }]);

  return YardMap;
}();