import React from 'react';
import { View as RNView, ViewProps, Text } from 'react-native';

/**
 * 调试用 View：一旦发现字符串子节点，会打印出堆栈，方便定位
 * “Unexpected text node” 的来源。仅在需要排查时使用。
 */
function isTextElement(el: any): boolean {
  if (!el || !el.type) return false;
  if (typeof el.type === 'string') return el.type.toLowerCase() === 'text';
  const name = el.type.displayName || el.type.name;
  return name === 'Text';
}

function sanitize(child: any): any {
  if (child === null || child === undefined || typeof child === 'boolean') return null;
  if (typeof child === 'string') {
    if (!child.trim()) return null;
    console.error('DebugView 捕获字符串子节点:', JSON.stringify(child), new Error().stack);
    return <Text>{child}</Text>;
  }
  if (typeof child === 'number') {
    console.error('DebugView 捕获数字子节点:', JSON.stringify(child), new Error().stack);
    return <Text>{String(child)}</Text>;
  }
  if (Array.isArray(child)) return child.map(sanitize);
  if (React.isValidElement(child)) {
    if (isTextElement(child)) return child;
    const nextChildren = sanitize((child as any).props?.children);
    return React.cloneElement(child, { ...(child as any).props, children: nextChildren });
  }
  return child;
}

export default function DebugView(props: ViewProps) {
  const safeChildren = sanitize(props.children);
  return <RNView {...props}>{safeChildren}</RNView>;
}
