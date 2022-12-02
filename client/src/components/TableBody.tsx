import { useState, useEffect } from "react";
import PartRow from "./PartRow";

interface Part {
    name: string;
    status: number;
    machine: string;
    needed: string;
    priority: string;
    files: Files[];
}

interface Files {
    name: string;
    filetype: string;
}

type Props = {
    hotPart: Part;
    setHotPart: (hotPart: Part) => void;
    setPopupPart: (hotPart: Part) => void;
};

export default function TableBody({ setPopupPart, setHotPart }: Props) {
    let [parts, setParts] = useState<Part[]>([
        {
            name: "",
            status: 0,
            machine: "",
            needed: "0",
            priority: "",
            files: [],
        },
    ]);

    useEffect(() => {
        const callGetAllBooks = async () => {
            await getAllParts();
        };
        callGetAllBooks();
    }, []);

    const getAllParts = async () => {
        const testPartArray: Part[] = [
            {
                name: "Swerve Plate",
                status: 1,
                machine: "Tormach",
                needed: "1",
                priority: "1",
                files: [],
            },
            {
                name: "Spacer",
                status: 0,
                machine: "Lathe",
                needed: "1",
                priority: "2",
                files: [],
            },
            {
                name: "Block",
                status: 3,
                machine: "Nebula",
                needed: "1",
                priority: "3",
                files: [],
            },
        ];

        setParts(testPartArray);
    };

    return (
        <>
            {parts.map((part: Part, id: number) => {
                return (
                    <PartRow key={id} part={part} setPopupPart={setPopupPart} setHotPart={setHotPart}/>
                );
            })}
        </>
    );
}