import { Node } from "@tiptap/core";

/**
 * Custom TipTap node for Notion-style callouts.
 * Renders as a `<div class="nc-callout">` with an icon and colored background.
 *
 * Attributes: `icon` (emoji string, default "💡"), `color` (key, default "blue").
 */
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: () => ReturnType;
      toggleCallout: () => ReturnType;
    };
  }
}

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      icon: { default: "💡" },
      color: { default: "blue" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const icon = (node.attrs.icon as string) || "💡";
    return [
      "div",
      { ...HTMLAttributes, "data-callout": "", class: "nc-callout" },
      ["div", { class: "nc-callout-icon", contentEditable: "false" }, icon],
      ["div", { class: "nc-callout-content" }, 0],
    ];
  },

  addCommands() {
    return {
      setCallout:
        () =>
        ({ commands }) =>
          commands.wrapIn(this.name),
      toggleCallout:
        () =>
        ({ commands }) =>
          commands.toggleWrap(this.name),
    };
  },
});
