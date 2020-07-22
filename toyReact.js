const ToyReact = {
  createElement(type, attributes, ...children) {
    let element;
    if (typeof type === 'string') {
      element = new ElementWrapper(type);
      // console.log("createElement -> type", type)
    } else {
      element = new type;
    }

    for (let name in attributes) {
      element.setAttribute(name, attributes[name]);
    }
    let insertChildren = (children) => {
      for (let child of children) {
        if (typeof child === 'object' && child instanceof Array) {
          insertChildren(child);
        } else {
          if (!(child instanceof Component) && 
          !(child instanceof ElementWrapper) && 
          !(child instanceof TextWrapper))
            child = String(child || '');
          if (typeof child === "string") {
            child = new TextWrapper(child);
        }
          element.appendChild(child);
        }
      }
    }

    insertChildren(children);

    return element;
  },

  render(vdom, element) {
    let range = document.createRange();
    if(element.children.length) {
      range.setStartAfter(element.lastChild);
      range.setEndAfter(element.lastChild);
    } else {
      range.setStart(element, 0);
      range.setEnd(element, 0);
    }
    vdom.mountTo(range);
  }
}

// let childrenSymbol = Symbol("children");

class ElementWrapper {
  constructor (type) {
    this.type = type;
    this.props = Object.create(null);
    this.children = [];
  }
  setAttribute(name, value) {
    this.props[name] = value;
  }
  appendChild(vchild) {
    this.children.push(vchild.vdom);
  }

  get vdom() {
    return  this;
  }

  mountTo(range) {
    this.range = range;
    // 占位防止range上移
    let placeholder = document.createComment('placeholder');
    let pRange = document.createRange();
    pRange.setStart(this.range.endContainer, this.range.endOffset);
    pRange.setEnd(this.range.endContainer, this.range.endOffset);
    pRange.insertNode(placeholder);

    this.range.deleteContents();
    let element = document.createElement(this.type);


    for (let name in this.props) {
      let value = this.props[name];
      if (name.match(/^on([\s\S]+)$/)) {
        let eventName = RegExp.$1.replace(/^[\s\S]/, s => s.toLowerCase());
        element.addEventListener(eventName, value);
      }
      if (name === 'className') {
        name = 'class';
      }
      element.setAttribute(name, value);
    }

    for (let child of this.children) {
      let range = document.createRange();
      if (element.children.length) {
        range.setStartAfter(element.lastChild);
        range.setEndAfter(element.lastChild);
      } else {
        range.setStart(element, 0);
        range.setEnd(element, 0);
      }
      child.mountTo(range);
    }

    range.insertNode(element);
  }
}

class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content);
    this.type = '#text';
    this.children = [];
    this.props = Object.create(null);
  }
  mountTo(range) {
    this.range = range;
    range.deleteContents();
    range.insertNode(this.root);
  }
  get vdom() {
    return this;
  }
}

export class Component{
  constructor() {
    this.children = [];
    this.props = Object.create(null);
    this.state = Object.create(null);
  }
  get type() {
    return this.constructor.name;
  }
  setAttribute(name, value) {
    this.props[name] = value;
    this[name] = value;
  }
  mountTo(range) {
    this.range = range;
    this.update();
  }
  update() {
    let vdom = this.vdom;
    if (this.oldvdom) {
      let replace = (newTree, oldTree, indent) => {
        console.log(indent, "Component -> replace -> newTree, oldTree, indent", newTree, oldTree)
        if (isSameTree(newTree, oldTree)) {
          console.log('all same');
          return;
        }
        if (!isSameNode(newTree, oldTree)) {
          newTree.mountTo(oldTree.range);
        } else {
          console.log('all different');
          for (let i = 0;i <newTree.children.length; i ++) {
            replace(newTree.children[i], oldTree.children[i], " " + indent);
          }
        }
      }
      let isSameNode = (node1, node2) => {
        if (!node2) return false;
        if (node1.type !== node2.type) return false;
        for (let name in node1.props) {
          // if (typeof node1.props[name] === "function" && typeof node2.props[name] ==='function' && node1.props[name].toString() === node2.props[name].toString()) {
          //   continue            
          // }
          if (typeof node1.props[name] === "object" && typeof node2.props[name] ==='object' && node1.props[name].toString() === node2.props[name].toString()) {
            continue            
          }
          if (node1.props[name] !== node2.props[name]) return false;
        }
        if (Object.keys(node1.props).length !== Object.keys(node2.props).length) return false;
        return true;
      }
      let isSameTree = (node1, node2) => {
        if (!isSameNode(node1, node2)) return false;
        if (node1.children.length !== node2.children.length) return false;
        for (let i = 0; i < node1.children.length; i ++) {
          if (!isSameTree(node1.children[i], node2.children[i])) return false;
        }
        return true;
      }
      replace(vdom, this.oldvdom, "");
    } else {
      vdom.mountTo(this.range);
    }
    this.oldvdom = vdom;
  }

  get vdom() {
    return this.render().vdom;
  }

  appendChild(vchild) {
    this.children.push(vchild);
  }
  setState(state) {
    let merge = (oldState, newState) =>  {
      for (let p in newState) {
        if (typeof newState[p] === 'object') {
          if (newState[p] instanceof Array) {
            oldState[p] = newState[p];
          } else {
            if (typeof oldState[p] !== 'object' && newState[p] !== null) {
              oldState[p] = {};
            }
            merge(oldState[p], newState[p]);
          }
        } else  {
          oldState[p] = newState[p];
        }
      }
    }
    if (!this.state && state)
      this.state = {};
    merge(this.state, state);
    this.update();
  }
}

export default ToyReact;