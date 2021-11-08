export default class CyberTrajectory extends CyberTrajectoryUI {
    constructor() {
        super();
        let pos1 = [0, 0];
        this.panelTrajectory.on(Laya.Event.MOUSE_DOWN, this, e => pos1 = [e.stageX, e.stageY]);
        this.panelTrajectory.on(Laya.Event.MOUSE_UP, this, e => {
            const distanceX = e.stageX - pos1[0];
            const distanceY = e.stageY - pos1[1];
            if(Math.sqrt(Math.abs(distanceX) + Math.abs(distanceY)) > 10) {
                return;
            }
            this.onNext();
        });
        this.btnSummary.on(Laya.Event.CLICK, this, this.onSummary);

        this.panelTrajectory.vScrollBar.elasticDistance = 150;

        let interval = null;
        let timeout = null;

        const scroll = alter => {
            let value = this.panelTrajectory.vScrollBar.value + alter;
            if(value < 0) value = 0;
            if(value > this.panelTrajectory.vScrollBar.max) value = this.panelTrajectory.vScrollBar.max;
            this.panelTrajectory.scrollTo(0, value);
        }
        const on = (btn, alter) => {
            btn.off(Laya.Event.CLICK, this, scroll);
            btn.on(Laya.Event.CLICK, this, scroll, [100*alter]);
            timeout = setTimeout(() => {
                btn.off(Laya.Event.CLICK, this, scroll);
                interval = setInterval(() => scroll(10*alter), 10);
            }, 100);
        }
        const clear = () => {
            if(interval) {
                clearInterval(interval);
                interval = null;
            }
            if(timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
        };
        this.btnUp.on(Laya.Event.MOUSE_DOWN, this, on, [this.btnUp, -1]);
        this.btnDown.on(Laya.Event.MOUSE_DOWN, this, on, [this.btnDown, 1]);
        this.btnUp.on(Laya.Event.MOUSE_UP, this, clear);
        this.btnUp.on(Laya.Event.MOUSE_OUT, this, clear);
        this.btnDown.on(Laya.Event.MOUSE_UP, this, clear);
        this.btnDown.on(Laya.Event.MOUSE_OUT, this, clear);

    }

    static load() {
        return ['images/slider/vslider_1@3x$bar.png'];
    }

    static #createComponent = plugin.extractComponents(CyberTrajectory.uiView, ['boxTrajectoryItem']);
    #createTrajectoryItem() {
        const item = CyberTrajectory.#createComponent('boxTrajectoryItem');
        item.labContent = item.getChildByName('labContent');
        item.labAge = item.getChildByName('hboxAge').getChildByName('labAge');
        return item;
    }
    #isEnd;
    #trajectoryItems;
    #talents;

    init({propertyAllocate, talents}) {
        this.#trajectoryItems = [];
        this.#isEnd = false;
        this.#talents = talents;
        core.restart(propertyAllocate);
        this.updateProperty();
    }

    close() {
        this.#trajectoryItems.forEach(item => {
            item.removeSelf();
            item.destroy();
        });
        this.#trajectoryItems = null;
    }

    updateProperty() {
        const types = core.PropertyTypes;
        const propertys = core.propertys;

        this.labCharm.text = propertys[types.CHR];
        this.labIntelligence.text = propertys[types.INT];
        this.labStrength.text = propertys[types.STR];
        this.labMoney.text = propertys[types.MNY];
        this.labSpirit.text = propertys[types.SPR];
    }

    onNext() {
        if(this.#isEnd) return;

        const { age, content, isEnd } = core.next();
        this.#isEnd = isEnd;

        if(isEnd) {
            console.debug('end');
        }

        const item = this.#createTrajectoryItem();
        item.labAge.text = ''+age;
        item.labContent.text = content.map(
            ({type, description, grade, name, postEvent}) => {
                switch(type) {
                    case 'TLT':
                        return `天赋【${name}】发动：${description}`;
                    case 'EVT':
                        return description + (postEvent?`\n${postEvent}`:'');
                }
            }
        ).join('\n');
        this.vboxTrajectory.addChild(item);
        this.#trajectoryItems.push(item);
        this.#trajectoryItems.forEach((item, index) => item.y = index);
        Laya.timer.frameOnce(1, this, () => {
            this.panelTrajectory.scrollTo(0, this.panelTrajectory.contentHeight);
        });
        this.updateProperty();
    }

    onSummary() {
        const talents = this.#talents;
        UIManager.getInstance().switchView(UIManager.getInstance().themes.SUMMARY, {talents});
    }

}