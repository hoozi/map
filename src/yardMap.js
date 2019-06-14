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
  radarSiteWidth: 4,
  radarSiteHeight: 4,
  radarSiteMargin: 2,
  siteSelectedColor: '#389e0d',
  siteColor: '#fff',
  siteCtnColor: '#fa541c'
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
    this.radarElement = document.querySelector('.radar');
    this.radarCanvas = document.querySelector('.canvas-radar');
    this.radarCtx = this.radarCanvas.getContext('2d');
    this.radarFrame = document.querySelector('.radar-frame')
    this.siteWidth = this.mapConfig.siteWidth; //每个位置的宽
    this.siteHeight = this.mapConfig.siteHeight; //每个位置的高
    this.siteMargin = this.mapConfig.siteMargin; //每个位置的间距
    this.viewWidth = this.mapConfig.viewWidth ||  window.innerWidth; //整个视图宽
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
    const mapOffset = $(this.mapCanvas).offset();
    this.mapOffset = {
      ...mapOffset
    }
    this.selectedSites = []; // 选中的位置
    this.selectedPrevSite = {};
    this.initScale();
    this.createIndex();
    this.bindEvent();
    this.init();
  }

  //初始化
  init() {
    this.initSize();
    this.initRadar();
    this.setMatrix({
      dx: Math.round((this.viewWidth - this.mapWidth*this.scale) / 2),
      dy: this.mapConfig.offset.dy
    });
    this.renderMap(this.mapCtx);
    this.renderRadar(this.radarCtx);
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
    const { siteWidth, siteMargin, siteHeight, padding, radarSiteWidth, radarSiteHeight, radarSiteMargin } = this.mapConfig;
    const mapWidth = siteWidth * maxColumn + siteMargin * (maxColumn - 1) + padding.left + padding.right; //地图的宽度 = 位置的宽度*列数 + 位置间距*（列数-1）+ 左padding + 右padding
    const mapHeight = (siteHeight+siteMargin) * maxRow + padding.top;
    const radarWidth = radarSiteWidth * maxColumn + radarSiteMargin * (+maxColumn+1);
    const radarHeight = (radarSiteHeight+radarSiteMargin) * maxRow;
    return {
      maxColumn,
      minColumn,
      maxRow,
      minRow,
      mapWidth,
      mapHeight,
      radarWidth,
      radarHeight,
      site: site.map(item => {
        const { column, row } = item;
        const vx = (siteWidth + siteMargin ) * (column - 1) + padding.left;
        const vy = (siteHeight + siteMargin) * (row - 1) + padding.top;
        const rx  = (radarSiteWidth + radarSiteMargin) * (column-1) + radarSiteMargin;
        const ry = (radarSiteHeight + radarSiteMargin) * (row - 1) + radarSiteMargin
        return {
          ...item,
          vx,
          vy,
          rx,
          ry
        }
      })
    }
  }

  //得到点击位置
  getTapedSite(centerX, centerY) {
    return this.mapData.site.filter(item => {
      const { vx, vy } = item;
      const toRight = vx + this.mapConfig.siteWidth;
      const toBottom = vy + this.mapConfig.siteHeight;
      return vx <= centerX && centerX <= toRight && vy <= centerY && centerY <= toBottom;
    })
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

  //雷达图初始化
  initRadar() {
    if(!this.mapConfig.radar) return;
    let radarWidth = this.radarWidth,
        radarHeight = this.radarHeight;
        
    if(radarWidth > radarHeight && radarWidth > this.maxRadarWidth) {
      this.radarScale = this.maxRadarWidth / radarWidth;
      radarHeight*=this.radarScale;
      radarWidth = this.maxRadarWidth;
    } else {
      if(radarHeight > radarWidth && radarHeight > this.maxRadarWidth) {
        this.radarScale = this.maxRadarWidth / radarHeight;
        radarWidth*=this.radarScale;
        radarHeight = this.maxRadarWidth;
      }
    }
    this.radarWidth = radarWidth;
    this.radarHeight = radarHeight;
    this.radarCanvas.width = radarWidth * this.dpr;
    this.radarCanvas.height = radarHeight * this.dpr;
    this.radarCanvas.style.width = `${this.radarWidth}px`;
    this.radarCanvas.style.height = `${this.radarHeight}px`;
    this.radarCtx.scale(this.dpr * this.radarScale, this.dpr * this.radarScale);
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
      this.showRadar();
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
    const centerX = e.center.x - this.mapOffset.left - this.dx,
          centerY = e.center.y - this.mapOffset.top - this.dy,
          scaleCenterX = centerX / this.scale,
          scaleCenterY = centerY / this.scale,
          tapedSite = this.getTapedSite(scaleCenterX, scaleCenterY)[0];
    if(this.scale !== 1) {
      this.setMatrix({
        scale: 1,
        dx: this.dx + Math.round(centerX - scaleCenterX),
        dy: this.dy + Math.round(centerY - scaleCenterY)
      });
      this.checkBoundary();
      this.updateMap();
    }
    this.showRadar();
    if(tapedSite) {
      this.selectSeats(tapedSite);
    }
  }

  //位置选中
  selectSeats(site) {
    let selectState = '';
    selectState = this.isSelected(site) ? 'dselected' : 'selected';
    if(selectState === 'dselected' || selectState === 'selected') {
      selectState === 'selected' ? this.addSeletedSite(site) : this.removeSelectedSite(site);
      this.renderMap(this.mapCtx);
      this.renderRadar(this.radarCtx);
      this.selectedSites.forEach(item => {
        this.renderSite(this.mapCtx, { 
          color: this.getSiteColor(item), 
          site: item,
          redraw: true
        });
        this.mapConfig.radar && this.renderRadarSite(this.radarCtx, {
          color: this.getSiteColor(item),
          site: item,
          redraw: true
        })
      })
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

  isSelected(site) {
    return this.selectedSites.some(item => {
      return item.siteId === site.siteId
    });
  }

  addSeletedSite(site) {
    if(!this.isSelected(site)) {
      this.selectedSites[0] = site;
    }
  }

  removeSelectedSite(site) {
    this.selectedSites = this.selectedSites.filter(item => {
      return item.siteId !== site.siteId;
    })
  }

  canSelect(site) {
    return site.status === '1';
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
        this.renderSite(ctx, {
          color: this.getSiteColor(item),
          site: item
        })
      });
      ctx.save();
    }
  }

  //渲染雷达图
  renderRadar(ctx) {
    if(!this.mapConfig.radar) return;
    this.mapData.site.forEach(item => {
      this.renderRadarSite(ctx, {
        color: this.getSiteColor(item),
        site: item
      })
    });
  }

  //渲染雷达位置
  renderRadarSite(ctx, renders) {
    const { site, color, redraw } = renders;
    const { rx, ry } = site;
    ctx.fillStyle = color;
    if(redraw) {
      ctx.clearRect(rx, ry, this.mapConfig.radarSiteWidth, this.mapConfig.radarSiteHeight);
      ctx.fillRect(rx, ry, this.mapConfig.radarSiteWidth, this.mapConfig.radarSiteHeight);
    } else {
      ctx.fillRect(rx, ry, this.mapConfig.radarSiteWidth, this.mapConfig.radarSiteHeight)
    }
  }

  //渲染贝位
  renderSite(ctx, renders) {
    const { site, color, redraw } = renders;
    const { vx, vy } = site;
    ctx.fillStyle = color;
    if(redraw) {
      ctx.clearRect(vx, vy, this.mapConfig.siteWidth, this.mapConfig.siteHeight);
      ctx.fillRect(vx, vy, this.mapConfig.siteWidth, this.mapConfig.siteHeight);
    } else {
      ctx.fillRect(vx, vy, this.mapConfig.siteWidth, this.mapConfig.siteHeight)
    }
   
  }

  //更新整个map 包括坐标轴等
  updateMap() {
    this.updateRadar();
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

  //更新雷达
  updateRadar() {
    if(!this.mapConfig.radar) return 
    let scaleMapWidth = this.mapWidth * this.scale,
        scaleMapHeight = this.mapHeight * this.scale,
        viewWidth = this.viewWidth,
        viewHeight = this.viewHeight,
        widthRatio = viewWidth / scaleMapWidth,
        heightRatio = viewHeight / scaleMapHeight,
        dx = -this.dx / scaleMapWidth * this.radarWidth,
        dy = -(this.dy-this.mapConfig.offset.dy) / scaleMapHeight * this.radarHeight;
    $(this.radarFrame).css({
      width: this.radarWidth * (widthRatio > 1 ? 1 : widthRatio),
      height: this.radarHeight*(heightRatio > 1 ? 1 : heightRatio),
      transform: `translate3d(${dx}px, ${dy}px,0)`
    })
  }

  //显示雷达图
  showRadar() {
    if(!this.mapConfig.radar) return;
    this.timer && clearTimeout(this.timer);
    $(this.radarElement).addClass('active');
    this.timer = setTimeout(()=>{
      $(this.radarElement).removeClass('active');
    }, 2000)
  }
  getSiteColor(site) {
    const { siteColor, siteCtnColor, siteSelectedColor } = this.mapConfig;
    return this.isSelected(site) ? siteSelectedColor : site.status == 1 ? siteColor : siteCtnColor;
  }
  
}