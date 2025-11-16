'use client';
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import PaperInfo from "./paperInfo";
import PaperTab from "./paperTab";
import { useSearchParams } from "next/navigation";
import Loading from "../components/loading";
import Protected from "../Protected";
import QaTab from "./qaTap";
import Revalidate from "../revalidation/page";
export default function EditPQA() {
    type PaperData = {
        subject: string;
        year: number;
        semester: string;
        subCode?: string;
        season: string;
        course: string;
        branch: string;
        set: string,
        descr: string,
        paperLink: string;
        [key: string]: any;
    };
    const [data, setData] = useState<PaperData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"paperTab" | "qaTab" | "revalidate">("qaTab");
    var pid: any;
    try {
        const searchParams = useSearchParams() || "";
        pid = searchParams.get("id");

    } catch (error) {

    }

    useEffect(() => {
        if (!pid) {
            setError("No paper ID provided");
            return;
        }

        const fetchPaper = async () => {
            try {
                const snap = await getDoc(doc(db, "papers", pid));
                if (snap.exists()) {
                    setData(snap.data() as PaperData);
                } else {
                    setError("Paper not found");
                }
            } catch (err) {
                console.error("Error fetching paper:", err);
                setError("Failed to fetch paper");
            }
        };

        fetchPaper();
    }, [pid]);

    if (error) {
        return <div className="p-4 text-red-600">{error}</div>;
    }

    if (!data) return <Loading />

    const tabClass = (tab: "paperTab" | "qaTab" | "revalidate") =>
        `p-2 ${activeTab === tab ? "bg-amber-50 shadow font-medium" : "bg-amber-50/70 border-e border-gray-300"}`;;
    return (
        <Protected>
            <div className="self-start flex-1 w-full ">
                <div className="bg-gray-300">
                    <div className="w-full max-w-[900px] mx-auto">
                        <PaperInfo data={data} />
                    </div>
                </div>

                <div className="bg-gray-600 w-full">
                    <div className="flex">
                        <button onClick={() => setActiveTab("qaTab")} className={tabClass("qaTab")}>
                            Edit Que Ans
                        </button>
                        <button onClick={() => setActiveTab("paperTab")} className={tabClass("paperTab")}>
                            Edit Paper
                        </button>
                        <button onClick={() => setActiveTab("revalidate")} className={tabClass("revalidate")}>
                            Revalidate
                        </button>
                    </div>
                </div>

                <div className="py-2 ">
                    <div className={activeTab === "paperTab" ? "" : "hidden"}>
                        <PaperTab paperInfo={data} />
                    </div>
                    <div className={activeTab === "qaTab" ? "" : "hidden"}>
                        <QaTab paperInfo={data} />
                    </div>
                    <div className={activeTab === "revalidate" ? "" : "hidden"}>
                        <Revalidate />
                    </div>
                </div>

            </div>
        </Protected>
    );
}

