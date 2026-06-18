import Image from "next/image";
import Link from "next/link";

type AgentCardProps = {
  id: string | number;
  name: string;
  description?: string;
  imageUrl?: string | "";
  color?: string | "blue-500";
};

export default function HeaderChatBox({ name, id, imageUrl, description }: AgentCardProps) {
  return (
    <div className="flex flex-row items-center gap-2 justify-start py-2 border-b border-gray-50 mb-2">
      <div className="relative w-12 h-12 mb-4">
        <Image
          src={
            imageUrl ? imageUrl : "/image/61m0SZMyRzL._AC_UF1000,1000_QL80_.jpg"
          }
          alt="Siri Avatar"
          fill
          className="rounded-full object-cover  border-white  h-5 w-5"
        />
        <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
      </div>
      <div className="flex  justify-center flex-col gap-0">
        <Link href={"/"} className="text-lg font-bold text-gray-900 text-left">
          {name}
        </Link>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}
