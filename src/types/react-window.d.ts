import type * as React from "react";

declare module "react-window" {
  export interface ListChildComponentProps<ItemData = any> {
    index: number;
    style: React.CSSProperties;
    data: ItemData;
    isScrolling?: boolean;
  }

  export interface FixedSizeListProps<ItemData = any> {
    height: number;
    itemCount: number;
    itemSize: number;
    width: number;
    itemData: ItemData;
    children: React.ComponentType<ListChildComponentProps<ItemData>>;
  }

  export class FixedSizeList<ItemData = any> extends React.Component<
    FixedSizeListProps<ItemData>
  > {}
}
