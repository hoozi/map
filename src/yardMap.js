function getWindowSize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  return { width, height };
}



const mapConfig = {
  siteWidth : 40, //每个位置的宽
  siteHeight: 40, //每个位置的高
  siteMargin: 8,//每个位置的间距
  offset : {
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
  siteDistance: 45
}

// 获得dpr
const getPixelRatio = () => {
  let canvas = document.createElement('canvas');
  let ctx = canvas.getContext('2d');
  const devicePixelRatio = window.devicePixelRatio || 1;
  const canvasPixelRatio= ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio ||ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1;
  const dpr = devicePixelRatio / canvasPixelRatio;
  canvas = null;
  ctx = null;
  return dpr > 2 ? 2 : Math.round(dpr);
}

class Site {
 
}

class YardMap {
  constructor(options) {
    this.mapConfig = $.extend({},mapConfig,options);
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
    const mapOffset = $(this.mapCanvas).offset();
    this.mapOffset = {
      ...mapOffset
    }
    this.initScale();
    this.createIndex();
    this.bindEvent();
    this.init();
  }



  //初始化
  init() {
    this.initSize();
    this.setMatrix({
      dx: Math.round((this.viewWidth - this.mapWidth*this.scale) / 2),
      dy: this.mapConfig.offset.dy
    });
    this.renderMap(this.mapCtx);
  }

  initSize() {
    this.mapCanvas.width = this.viewWidth * this.dpr;
    this.mapCanvas.height = this.viewHeight * this.dpr;
    this.mapCanvas.style.width = `${this.viewWidth}px`;
    this.mapCanvas.style.height = `${this.viewHeight}px`
  }

  // 创建x,y轴坐标
  createIndex() {
    this.xIndex = {
      columns: this.getIndexName('x'),
      columnWidth: this.mapConfig.siteWidth + this.mapConfig.siteMargin, // x轴宽
    }; //x轴索引
    this.yIndex = {
      rows: this.getIndexName('y'),
      rowHeight: this.mapConfig.siteHeight + this.mapConfig.siteMargin, // y轴高
    }; //y轴索引
    const yHtml = _.template(this.indexItems)({
      data: this.yIndex,
      scale: this.scale
    });
    const xHtml = _.template(this.indexItems)({
      data: this.xIndex,
      scale: this.scale
    });
    this.yindex.html(yHtml);
    this.xindex.css({
      'width': this.mapWidth,
      'left': Math.round((this.viewWidth - this.mapWidth*this.scale) / 2)+20*this.scale
    }).html(xHtml);
  }

  //解析地图的数据
  getMapData(data){
    const { maxColumn, maxRow, minColumn, minRow, site } = data;
    const { siteWidth, siteMargin, siteHeight, padding } = this.mapConfig;
    const mapWidth = siteWidth * maxColumn + siteMargin * (maxColumn - 1) + padding.left + padding.right; //地图的宽度 = 位置的宽度*列数 + 位置间距*（列数-1）+ 左padding + 右padding
    const mapHeight = siteHeight * maxRow + siteMargin * (maxRow - 1) + padding.top
    return {
      maxColumn,
      minColumn,
      maxRow,
      minRow,
      mapWidth,
      mapHeight,
      site: site.map(item => {
        const { column, row } = item;
        const vx = (siteWidth + siteMargin ) * (column - 1) + padding.left;
        const vy = (siteHeight + siteMargin) * (row - 1) + padding.top;
        return {
          ...item,
          vx,
          vy
        }
      })
    }
  }

  //得到索引
  getIndexName(dir) {
    const { minColumn, maxColumn, minRow, maxRow } = this.mapData;
    const indexes = []
    const indexMap = {
      'x': {
        min: +minColumn,
        max: +maxColumn,
        group: _.groupBy(this.mapData.site, item => item.column)
      },
      'y': {
        min: +minRow,
        max: +maxRow,
        group: _.groupBy(this.mapData.site, item => item.row)
      }
    }
    for(let index = indexMap[dir].min ; index<indexMap[dir].max+1; index++) {
      indexes.push({ index })
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
  }

  //初始化缩放
  initScale() {
    let scale = Math.min((this.viewHeight-this.mapConfig.offset.dy) / this.mapHeight, (this.viewWidth-this.mapConfig.offset.dx) / this.mapWidth);
    if(this.viewHeight >= this.mapHeight && this.viewWidth >= this.mapWidth) {
      scale = 1;
    }
    this.minScale = scale;
    this.scale = scale;
  }

  //绑定手势
  bindEvent() {
    this.mc = new Hammer.Manager(this.mapCanvas);
    this.mc.add(new Hammer.Pan);
    this.mc.add(new Hammer.Tap);
    this.mc.add(new Hammer.Pinch);
    this.mc.on('panstart', () => {
      this.startDy = this.dy;
      this.startDx = this.dx;
    })
    this.mc.on('panmove', e => {
      this.setMatrix({
        scale: this.scale,
        dx: this.startDx + e.deltaX,
        dy: this.startDy + e.deltaY
      });
      this.updateMap();
    });
    this.mc.on('panend', () => {
      this.checkBoundary();
      this.updateMap();
    });
    this.mc.on('pinchstart', () => {
      //禁止拖拽
      this.mc.get('pan').set({enable: false}) 
    });
    this.mc.on('pinchmove', e => {
      let nowScale = this.scale * e.scale;
      nowScale <= this.minScale && (nowScale = this.minScale); //限制最小缩放为初始
      nowScale >= this.maxScale && (nowScale = this.maxScale); //限制最大缩放为1
      const xCenter = e.center.x - this.mapOffset.left,  // 获得x中心点
            yCenter = e.center.x - this.mapOffset.top, // 获得y轴中心点
            initXcenter = parseInt(xCenter / this.scale, 10),
            initYcenter = parseInt(yCenter / this.scale, 10),
            scaleXcenter = parseInt(xCenter / nowScale, 10),
            scaleYcenter = parseInt(yCenter/ nowScale, 10);
      this.setMatrix({
        scale: nowScale,
        dx: this.dx - (initXcenter - scaleXcenter),
        dy: this.dy - (initYcenter - scaleYcenter)
      });
      this.checkBoundary();
      this.updateMap();
    });
    this.mc.on('pinchend', () => {
      this.mc.get('pan').set({enable: true});
    })
    this.mc.on('tap', this.handleMapTap);
  }

  handleMapTap = e => {
    e.preventDefault();
    const _dx = e.center.x - this.mapOffset.left - this.dx,
          _dy = e.center.y - this.mapOffset.top - this.dy,
          _scaleX = _dx / this.scale,
          _scaleY = _dy / this.scale;
    this.scale !== 1 &&
    this.setMatrix({
      scale: 1,
      dx: this.dx + Math.round(_dx - _scaleX),
      dy: this.dy + Math.round(_dy - _scaleY)
    });
    this.checkBoundary();
    this.updateMap();
  }

  //检测边界
  checkBoundary() {
    let thisDx = this.dx,
        thisDy = this.dy,
        thisScale = this.scale,
        thisViewWidth = this.viewWidth,
        thisViewHeight = this.viewHeight,
        thisScaleMapWidth = this.mapWidth*thisScale,
        thisScaleMapHeight = this.mapHeight*thisScale;
    if(thisViewWidth >= thisScaleMapWidth) {
      let centerDx = (thisViewWidth - thisScaleMapWidth) / 2;
      thisDx!==centerDx && (thisDx = centerDx);
    } else {
      thisDx > 0 && (thisDx = 0);
      thisDx < -(thisScaleMapWidth-thisViewWidth) && (thisDx = -(thisScaleMapWidth-thisViewWidth))
    }
    if(thisViewHeight-this.mapConfig.offset.dy >= thisScaleMapHeight) {
      thisDy = this.mapConfig.offset.dy;
    } else {
      thisDy > this.mapConfig.offset.dy && (thisDy = this.mapConfig.offset.dy);
      thisDy < thisViewHeight - thisScaleMapHeight && (thisDy = thisViewHeight - thisScaleMapHeight);
    }
    this.dx = thisDx;
    this.dy = thisDy    
  }

  //设置地图的位移与缩放
  setMatrix(transform) {
    const { dy, dx, scale } = transform;
    dy && (this.dy = dy);
    dx && (this.dx = dx);
    scale && (this.scale = scale);
  }

  //渲染地图
  renderMap(ctx) {
    if(ctx) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.viewWidth * this.dpr, this.viewHeight * this.dpr);//清空画布
      ctx.restore();
      ctx.setTransform(this.scale * this.dpr, 0, 0, this.scale * this.dpr, this.dx * this.dpr, this.dy * this.dpr) //设置画布的缩放与位移
      this.mapData.site.forEach(item => {
        this.renderSite(ctx, item)
      });
      ctx.save();
    }
  }

  //更新整个map 包括坐标轴等
  updateMap() {
    this.renderMap(this.mapCtx);
    this.updateIndex();
  }

  //更新索引
  updateIndex() {
    const distanceX = this.dx;
    const distanceY = this.dy;
    const scale = this.scale;
    this.yindex.css('transform', `translate3d(0, ${distanceY - this.mapConfig.offset.dy}px,0)`);
    this.yindex.find('ul').css('line-height', `${(this.siteHeight + this.siteMargin)*scale}px`);
    this.xindex.css({
      'transform': `translate3d(${distanceX - this.mapConfig.offset.dx}px, 0 ,0)`,
      'left': 19*scale
    });
    this.xindex.find('ul>li').css('width', (this.siteWidth+this.siteMargin)*scale);
  }

  //渲染贝位
  renderSite(ctx, site) {
    ctx.fillStyle = site.status === '1' ? '#fff' : '#fa541c';
    ctx.fillRect(site.vx, site.vy, this.mapConfig.siteWidth, this.mapConfig.siteHeight)
  }
}