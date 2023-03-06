import { atom, useAtom, useAtomValue } from "./jotai";

const salaryAtom = atom(100_000);
const bonusAtom = atom(10_000);
const totalSalaryAtom = atom((get) => get(salaryAtom) + get(bonusAtom));
const dataAtom = atom(() => fetch("/data.json").then((res) => res.json()));
const keysAtom = atom((get) => Object.keys(get(dataAtom) ?? {}));

function SalaryDisplay() {
  const salary = useAtomValue(salaryAtom);
  return <div>SalaryDisplay: {salary}</div>;
}

function App() {
  const [salary, setSalary] = useAtom(salaryAtom);
  const [bonus, setBonus] = useAtom(bonusAtom);
  const totalSalary = useAtomValue(totalSalaryAtom);
  const data = useAtomValue(dataAtom);
  const keys = useAtomValue(keysAtom);

  return (
    <div>
      <div>
        <input value={salary} onChange={(e) => setSalary(+e.target.value)} />
      </div>
      <div>Salary: {salary}</div>
      <SalaryDisplay />

      <div>
        <input value={bonus} onChange={(e) => setBonus(+e.target.value)} />
      </div>
      <div>Bonus: {bonus}</div>

      <div>Total Salary: {totalSalary}</div>
      <div>Data: {JSON.stringify(data)}</div>
      <div>Keys: {JSON.stringify(keys)}</div>
    </div>
  );
}

export default App;
