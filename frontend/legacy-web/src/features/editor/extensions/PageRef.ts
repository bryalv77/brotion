import { Node } from "@tiptap/core";

/**
 * Custom TipTap node for Notion-style page references.
 * Renders as a clickable card (icon + title) that navigates to the referenced page.
 *
 * Attributes: `pageId` (target page id), `title` (snapshot), `icon` (snapshot).
 */
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageRef: {
      insertPageRef: (attrs: {
        pageId: string;
        title: string;
        icon?: string;
      }) => ReturnType;
    };
  }
}

export const PageRef = Node.create({
  name: "pageRef",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      pageId: { default: null },
      title: { default: "" },
      icon: { default: "📄" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-page-ref]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const icon = (node.attrs.icon as string) || "📄";
    const title = (node.attrs.title as string) || "Untitled";
    const pageId = (node.attrs.pageId as string) || "";
    return [
      "div",
      {
        ...HTMLAttributes,
        "data-page-ref": pageId,
        class: "nc-page-ref",
      },
      ["span", { class: "nc-page-ref-icon", contentEditable: "false" }, icon],
      ["span", { class: "nc-page-ref-title", contentEditable: "false" }, title],
    ];
  },

  addCommands() {
    return {
      insertPageRef:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs,
          }),
    };
  },
});
