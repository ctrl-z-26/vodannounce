export function VodafoneIcon({
   size = 20,
   className = '',
}: {
   size?: number;
   className?: string;
}) {
   return (
      <svg
         width={size}
         height={size}
         viewBox="0 0 32 32"
         fill="none"
         xmlns="http://www.w3.org/2000/svg"
         className={className}
      >
         <circle cx="16" cy="16" r="16" fill="#E60000" />
         <path
            d="M16 6C10.477 6 6 10.477 6 16s4.477 10 10 10 10-4.477 10-10S21.523 6 16 6zm0 15a5 5 0 110-10 5 5 0 010 10z"
            fill="white"
         />
      </svg>
   );
}
