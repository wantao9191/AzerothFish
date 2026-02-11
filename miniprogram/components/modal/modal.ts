Component({
    options: {
        addGlobalClass: true
    },
    properties: {
        show: {
            type: Boolean,
            value: false
        },
        title: {
            type: String,
            value: ''
        },
        confirmText: {
            type: String,
            value: '确定'
        },
        cancelText: {
            type: String,
            value: '取消'
        },
        showCancel: {
            type: Boolean,
            value: true
        }
    },
    methods: {
        preventTouch() { },
        onCancel() {
            this.triggerEvent('cancel');
        },
        onConfirm() {
            this.triggerEvent('confirm');
        }
    }
})
