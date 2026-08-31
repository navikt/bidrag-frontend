declare module "*.mdx" {
    const MDXComponent: (props: Record<string, unknown>) => React.ReactNode;
    export default MDXComponent;
}
