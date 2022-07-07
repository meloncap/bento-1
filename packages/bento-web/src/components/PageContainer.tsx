type PageContainerProps = React.HTMLAttributes<HTMLDivElement>;

export const PageContainer: React.FC<PageContainerProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={`min-h-screen px-4 pt-6 pb-24 flex ${className}`}
      {...props}
    >
      <div className="w-full max-w-[1100px] mx-auto relative z-0 flex flex-col">
        {children}
      </div>
    </div>
  );
};
