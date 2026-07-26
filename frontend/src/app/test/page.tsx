import prisma from "@/lib/prisma";

export default async function TestPage() {
    const data = await prisma.problem.findMany()
    return (
        <>
            <div>Test</div>
            <p>{data.toString()}</p>
        </ >
    );
}
