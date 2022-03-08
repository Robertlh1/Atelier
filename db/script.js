import http from 'k6/http';
import { sleep } from 'k6';

export default function () {
  http.get(`http://localhost:3001/api/fec2/hr-den/qa/questions/10/answers`);
  sleep(1);
}