'use client';
import { useSearchParams } from "next/navigation";
import CreatePaper from "../createPaper/page";
export default function EditPaper() {
  let paperInfo;
  try {
    const params: any = useSearchParams().get("paperInfo")||"";
    if (!params) {
      return <div>No paper data provided</div>;
    }
    paperInfo = JSON.parse(decodeURIComponent(params));
  } catch (err) {
    console.error("Invalid paperInfo:", err);
    return <div>Invalid paper data</div>;
  }

  return <CreatePaper paperInfo={paperInfo} />;
}
// var pid: any;
// try {
//   const searchParams = useSearchParams()||"";
//   pid = searchParams.get('id');
// }
// catch (error) {
//   console.error(error);
// }