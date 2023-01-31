import {get} from "lodash";
import ApiConfig = chrome.cast.ApiConfig;

let hoveredElement: null | EventTarget = null;
let hoveringSpan : HTMLElement | null = null;
let mousePosition = {x: 0, y: 0};

document.onmousemove = (event) => {
    const element: (EventTarget | null) = event.target;
    mousePosition = {x: event.pageX , y: event.pageY - 30 };
    if ( ! (element instanceof Element)) return;

    if (element !== hoveredElement) {
        hoveredElement = element;
    }
    if (hoveringSpan){
        hoveringSpan.style.top = mousePosition.y + 'px';
        hoveringSpan.style.left = mousePosition.x + 'px';
    }
}


const dataCyWorker = (elements: any[] | NodeListOf<Element>) => {
    elements.forEach(element => {
        const span = createStyledSpan(element);

        span.innerHTML = element.getAttribute('data-cy');
        span.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            navigator.clipboard.writeText(element.getAttribute('data-cy'));
        }
    });
}

const reactWorker = (element: EventTarget | null) => {
    if (!element) return;
    const keys = Object.keys(element);
    const reactKey = keys.find(key => key.startsWith('__reactFiber$'));
    if (!reactKey) return;
    let fiber = get(element, reactKey, null);
    if (!fiber) return;
    while (true)  {
        let name = get(fiber, "type.name", null);
        if (name && /^[\w]+Component/gi.test(name))  break;
        let parent = get(fiber, "_debugOwner", null);
        if (parent) fiber = parent;
        else break;
    }

    let name = get(fiber, "type.name", null);
    if (name === null) return;


    if (hoveringSpan) {
        hoveringSpan.innerHTML = name;
        return
    }

    const span = createStyledSpan(document.getElementById("react-main"));
    hoveringSpan = span;
    span.style.fontSize = '13px';
    span.style.padding = '2px 10px';
    console.log(mousePosition);
    span.style.top = mousePosition.y + 'px';
    span.style.left = mousePosition.x + 'px';
    span.innerHTML = name;

}


const createStyledSpan = (parent: HTMLElement | null ) => {
    const span = document.createElement('span');
    span.style.backgroundColor = "darkred";
    span.style.boxSizing = 'border-box';
    span.style.position = 'absolute';
    span.style.color = 'white';
    span.style.padding = '1px 2px';
    span.style.margin = '0';
    span.style.fontSize = '9px';
    span.style.zIndex= "99999999";
    span.style.cursor = 'copy';
    span.style.borderRadius = '4px';
    span.classList.add('datacy-extension');
    span.style.minHeight = '10px';
    span.style.minWidth = '10px';
    if (parent !== null) {
        span.style.top = parent.offsetTop + 'px';
        span.style.left = parent.offsetLeft + 'px';
        span.style.maxWidth = parent.offsetWidth + 'px';
        span.style.maxHeight = parent.offsetHeight + 'px';
        parent.style.boxSizing = 'border-box';
        parent.style.outline = '1px solid darkred';
        parent.parentElement?.appendChild(span);
    }
    return span;
}



document.addEventListener('keydown', (event) => {
    if (event.key === 'Alt' && !event.repeat) {
        event.preventDefault();
        event.stopPropagation();
        dataCyWorker(document.querySelectorAll('[data-cy]'));
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'Alt') {
        event.preventDefault();
        event.stopPropagation();
        const matchingSpans= document.querySelectorAll('.datacy-extension');
        const matchingElements = document.querySelectorAll('[data-cy]') as NodeListOf<HTMLElement>;
        matchingSpans.forEach(span => span.remove());
        matchingElements.forEach((element) => element.style.outline = 'unset');
    }
});


document.addEventListener('keydown', (event) => {
    if (event.key === 'Shift') {
        event.preventDefault();
        event.stopPropagation();
        reactWorker(hoveredElement);
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'Shift') {
        event.preventDefault();
        event.stopPropagation();
        if (hoveringSpan) {
            navigator.clipboard.writeText(hoveringSpan.innerHTML);
            hoveringSpan.remove();
            hoveringSpan = null;
        }
    }
});

export {};



function FindNode(dom: HTMLElement, traverseUp = 0) {
    const key = Object.keys(dom).find(key=>{
        return key.startsWith("__reactFiber$") 
            || key.startsWith("__reactInternalInstance$"); 
    });

    if (!key) return null;

    const domFiber = get(dom, key, null);
    if (domFiber == null) return null;

    
    const GetCompFiber = (fiber: { return: any; }) =>{
        let parentFiber = fiber.return;
        while (typeof parentFiber.type == "string") {
            parentFiber = parentFiber.return;
        }
        return parentFiber;
    };
    let compFiber = GetCompFiber(domFiber);
    for (let i = 0; i < traverseUp; i++) {
        compFiber = GetCompFiber(compFiber);
    }
    return compFiber.stateNode;
}