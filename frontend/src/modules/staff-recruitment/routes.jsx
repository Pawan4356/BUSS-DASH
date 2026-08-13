import { Route } from 'react-router-dom'
import { RecruitmentList } from './RecruitmentList'
import { RecruitmentDetail } from './RecruitmentDetail'
import { CandidatesLanding } from './CandidatesLanding'
import { CandidateList } from './CandidateList'
import { CandidateDetail } from './CandidateDetail'

export const staffRecruitmentRoutes = (
  <>
    <Route index element={<RecruitmentList />} />
    <Route path="candidates" element={<CandidatesLanding />} />
    <Route path="candidates/:recruitmentId" element={<CandidateList />} />
    <Route path="candidates/:recruitmentId/:candidateId" element={<CandidateDetail />} />
    <Route path=":id" element={<RecruitmentDetail />} />
  </>
)
