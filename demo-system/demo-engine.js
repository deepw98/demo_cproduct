const DemoPlayer = {

    data: null,
    currentStep: 0,
    recordMode: false,
    renderToken: 0,

    init(){
        this.screen = document.getElementById("demo-screen")
        this.hotspot = document.getElementById("hotspot")
        this.tooltip = document.getElementById("tooltip")

        // 🔹 Hotspot click
        this.hotspot.addEventListener("click", (e) => {

            if(this.recordMode){
                e.stopPropagation()
                return
            }

            this.nextStep()
        })

        // 🔹 Record mode click capture
        this.screen.addEventListener("click", (e) => {

            if(!this.recordMode) return

            const container = this.screen.parentElement
            const rect = container.getBoundingClientRect()

            const naturalWidth = this.screen.naturalWidth
            const naturalHeight = this.screen.naturalHeight

            const rawScale = Math.min(
                rect.width / naturalWidth,
                rect.height / naturalHeight
            )

            const scale = Math.round(rawScale * 1000) / 1000

            const renderedWidth = naturalWidth * scale
            const renderedHeight = naturalHeight * scale

            const offsetX = (rect.width - renderedWidth) / 2
            const offsetY = (rect.height - renderedHeight) / 2

            const clickX = e.clientX - rect.left - offsetX
            const clickY = e.clientY - rect.top - offsetY

            const x = (clickX / renderedWidth) * 100
            const y = (clickY / renderedHeight) * 100

            console.log(`x: ${x.toFixed(2)}%, y: ${y.toFixed(2)}%`)
        })

        // 🔹 Resize (debounced + stable)
        let resizeTimeout = null

        window.addEventListener("resize", () => {

            clearTimeout(resizeTimeout)

            resizeTimeout = setTimeout(() => {

                const step = this.data?.steps[this.currentStep]
                if(!step) return

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        this.renderHotspot(step)
                    })
                })

            }, 100)
        })

        this.loadDemo()
    },

    getDemoName(){
        const params = new URLSearchParams(window.location.search)
        return params.get("demo") || "demo1"
    },

    async loadDemo(){
        const demoName = this.getDemoName()

        try{
            const res = await fetch(`./demos/${demoName}.json`)

            if(!res.ok){
                throw new Error("Demo JSON not found")
            }

            this.data = await res.json()
            this.showStep(0)

        }catch(err){
            console.error(err)
            alert("Failed to load demo")
        }
    },

    showStep(index){

        const step = this.data.steps[index]
        if(!step) return

        this.currentStep = index

        const token = ++this.renderToken

        this.screen.src = "./" + step.screen

        this.waitForImageRender(() => {

            if(token !== this.renderToken) return

            this.renderHotspot(step)
        })
    },

    waitForImageRender(callback){

        const img = this.screen

        if(img.complete){
            requestAnimationFrame(() => {
                requestAnimationFrame(callback)
            })
            return
        }

        img.onload = () => {
            requestAnimationFrame(() => {
                requestAnimationFrame(callback)
            })
        }
    },

    renderHotspot(step){

        const container = this.screen.parentElement
        const containerRect = container.getBoundingClientRect()

        const naturalWidth = this.screen.naturalWidth
        const naturalHeight = this.screen.naturalHeight

        const containerWidth = containerRect.width
        const containerHeight = containerRect.height

        const rawScale = Math.min(
            containerWidth / naturalWidth,
            containerHeight / naturalHeight
        )

        const scale = Math.round(rawScale * 1000) / 1000

        const renderedWidth = naturalWidth * scale
        const renderedHeight = naturalHeight * scale

        const offsetX = (containerWidth - renderedWidth) / 2
        const offsetY = (containerHeight - renderedHeight) / 2

        const h = step.hotspot

        const x = (h.x / 100) * renderedWidth
        const y = (h.y / 100) * renderedHeight
        const width = (h.width / 100) * renderedWidth
        const height = (h.height / 100) * renderedHeight

        const finalX = offsetX + x
        const finalY = offsetY + y

        // 🔥 Pixel-perfect rounding
        this.hotspot.style.left = Math.round(finalX) + "px"
        this.hotspot.style.top = Math.round(finalY) + "px"
        this.hotspot.style.width = Math.round(width) + "px"
        this.hotspot.style.height = Math.round(height) + "px"

        this.tooltip.innerText = this.recordMode ? "" : step.tooltip.text

        this.positionTooltip({
            x: finalX,
            y: finalY,
            width,
            height
        })
    },

    positionTooltip(h){

        const offset = 10

        let left = h.x + h.width + offset
        let top = h.y

        const tooltipWidth = this.tooltip.offsetWidth
        const tooltipHeight = this.tooltip.offsetHeight
        const containerRect = this.screen.parentElement.getBoundingClientRect()

        if(left + tooltipWidth > containerRect.width){
            left = h.x - tooltipWidth - offset
        }

        if(top + tooltipHeight > containerRect.height){
            top = containerRect.height - tooltipHeight - offset
        }

        if(top < 0){
            top = offset
        }

        // 🔥 Rounded tooltip
        this.tooltip.style.left = Math.round(left) + "px"
        this.tooltip.style.top = Math.round(top) + "px"
    },

    nextStep(){

        const step = this.data.steps[this.currentStep]

        if(step.next !== null){

            const nextIndex = this.data.steps.findIndex(s => s.id === step.next)

            if(nextIndex === -1){
                console.error("Invalid next step id:", step.next)
                return
            }

            this.showStep(nextIndex)

        } else {
            alert("Demo Finished")
        }
    }
}

DemoPlayer.init()