PS F:\magna m\RainCorp-main> cd frontend
PS F:\magna m\RainCorp-main\frontend> npx tsc --noEmit
src/components/ConnectionsTab.tsx:6:10 - error TS2305: Module '"@/app/user-profile/data"' has no exported member 'Connection'.

6 import { Connection } from '@/app/user-profile/data';    
           ~~~~~~~~~~

src/components/CourseCard.tsx:4:24 - error TS2307: Cannot find module '@/app/magna-school/constants' or its corresponding type declarations.

4 import { Course } from '@/app/magna-school/constants';   
                         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~    

src/components/CourseCurriculum.tsx:3:35 - error TS2307: Cannot find module '@/app/magna-school/[id]/constants' or its corresponding type declarations.

3 import { CurriculumSection } from '@/app/magna-school/[id]/constants';
                                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/components/CourseCurriculum.tsx:46:39 - error TS7006: Parameter 'lesson' implicitly has an 'any' type.

46                 {section.lessons.map((lesson, lIdx) => (                                         ~~~~~~

src/components/CourseCurriculum.tsx:46:47 - error TS7006: Parameter 'lIdx' implicitly has an 'any' type.

46                 {section.lessons.map((lesson, lIdx) => (                                                 ~~~~      

src/components/CourseHeader.tsx:3:30 - error TS2307: Cannot find module '@/app/magna-school/[id]/constants' or its corresponding type declarations.

3 import { CourseDetail } from '@/app/magna-school/[id]/constants';
                               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/components/EnrollmentCard.tsx:3:30 - error TS2307: Cannot find module '@/app/magna-school/[id]/constants' or its corresponding type declarations.

3 import { CourseDetail } from '@/app/magna-school/[id]/constants';
                               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/components/EnrollmentCard.tsx:32:33 - error TS7006: Parameter 'feature' implicitly has an 'any' type.

32           {course.features.map((feature, idx) => (      
                                   ~~~~~~~

src/components/EnrollmentCard.tsx:32:42 - error TS7006: Parameter 'idx' implicitly has an 'any' type.

32           {course.features.map((feature, idx) => (      
                                            ~~~

src/components/FeedItem.tsx:57:53 - error TS2339: Property 
'deadlineProgress' does not exist on type 'JobPost'.       

57   const [progress, setProgress] = useState(jobPost?.deadlineProgress || 0);
                                                       ~~~~~~~~~~~~~~~~

src/components/FeedItem.tsx:60:65 - error TS2339: Property 
'requestsSent' does not exist on type 'ProjectPost'.       

60   const [liveRequests, setLiveRequests] = useState(projectPost?.requestsSent || 0);
   
        ~~~~~~~~~~~~

src/components/FeedItem.tsx:67:23 - error TS7006: Parameter 'prev' implicitly has an 'any' type.

67           setProgress(prev => Math.min(prev + 0.5, 100));
                         ~~~~

src/components/FeedItem.tsx:80:27 - error TS7006: Parameter 'prev' implicitly has an 'any' type.

80           setLiveRequests(prev => prev + 1);
                             ~~~~

src/components/FeedItem.tsx:216:81 - error TS2339: Property 'description' does not exist on type 'JobPost'.

216             <p className={isDarkMode ? 'text-[#F4A261]' : 'text-gray-600'}>{job.description}</p>
    
                         ~~~~~~~~~~~

src/components/FeedItem.tsx:233:81 - error TS2339: Property 'timeLeft' does not exist on type 'JobPost'.

233                     <span className="text-[10px] font-bold text-[#E50914]">{job.timeLeft}</span>
    
                         ~~~~~~~~

src/components/FeedItem.tsx:259:16 - error TS18048: 'job.tags' is possibly 'undefined'.

259               {job.tags.map((tag) => (
                   ~~~~~~~~

src/components/FeedItem.tsx:328:109 - error TS2339: Property 'membersNeeded' does not exist on type 'ProjectPost'.    

328                 <span className={`font-medium ${isDarkMode ? 'text-[#F4A261]' : 'text-gray-700'}`}>{project.membersNeeded} builders needed</span>
    
                                                     ~~~~~~~~~~~~~

src/components/FeedItem.tsx:340:14 - error TS18048: 'project.tags' is possibly 'undefined'.

340             {project.tags.map((tag) => (
                 ~~~~~~~~~~~~

src/components/FeedItem.tsx:408:21 - error TS2322: Type 'string | undefined' is not assignable to type 'string'.      
  Type 'undefined' is not assignable to type 'string'.     

408                     alt={news.title}
                        ~~~

  node_modules/.pnpm/next@16.1.6_@babel+core@7.2_b7425865da53ff23ed15cc7a43c4bd25/node_modules/next/dist/client/image-component.d.ts:13:5
    13     alt: string;
           ~~~
    The expected type comes from property 'alt' which is declared here on type 'IntrinsicAttributes & Omit<DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>, "loading" | ... 5 more ... | "srcSet"> & { ...; } & RefAttributes<...>'

src/components/FeedItem.tsx:490:60 - error TS18048: 'regular.image' is possibly 'undefined'.

490                          console.log('Image data length:', regular.image.length);
    
    ~~~~~~~~~~~~~

src/components/FeedItem.tsx:491:60 - error TS18048: 'regular.image' is possibly 'undefined'.

491                          console.log('Image data prefix:', regular.image.substring(0, 50));
    
    ~~~~~~~~~~~~~

src/components/FeedItem.tsx:510:114 - error TS2339: Property 'length' does not exist on type 'never'.

510              initialLikes={typeof post.likes === 'number' ? post.likes : (Array.isArray(post.likes) ? post.likes.length : 0)}
    
                                                          ~~~~~~

src/components/FeedItem.tsx:511:129 - error TS2339: Property 'length' does not exist on type 'never'.

511              initialComments={typeof post.comments === 
'number' ? post.comments : (Array.isArray(post.comments) ? 
post.comments.length : 0)}
    

              ~~~~~~

src/components/InstructorBio.tsx:3:28 - error TS2307: Cannot find module '@/app/magna-school/[id]/constants' or its corresponding type declarations.

3 import { Instructor } from '@/app/magna-school/[id]/constants';
                             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/components/JobCard.tsx:51:23 - error TS18046: 'response' is of type 'unknown'.

51       setIsBookmarked(response.bookmarked || false);    
                         ~~~~~~~~

src/components/JobCard.tsx:88:23 - error TS18046: 'response' is of type 'unknown'.

88       setIsBookmarked(response.bookmarked || false);    
                         ~~~~~~~~

src/components/JobPostDetail.tsx:51:17 - error TS2339: Property 'description' does not exist on type 'JobPost'.       

51           {post.description}
                   ~~~~~~~~~~~

src/components/JobPostDetail.tsx:65:12 - error TS18048: 'post.tags' is possibly 'undefined'.

65           {post.tags.map(tag => (
              ~~~~~~~~~

src/components/JobPostDetails.tsx:112:17 - error TS2339: Property 'description' does not exist on type 'JobPost'.     

112           {post.description}
                    ~~~~~~~~~~~

src/components/JobPostDetails.tsx:126:12 - error TS18048: 'post.tags' is possibly 'undefined'.

126           {post.tags.map(tag => (
               ~~~~~~~~~

src/components/MagnaMessageBubble.tsx:9:24 - error TS2307: 
Cannot find module '@/app/magna-school/constants' or its corresponding type declarations.

9 import { Course } from '@/app/magna-school/constants';   
                         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~    

src/components/NotificationItem.tsx:14:24 - error TS2724: '"@/app/notifications/data"' has no exported member named 'NotificationType'. Did you mean 'Notification'?

14 import { Notification, NotificationType } from '@/app/notifications/data';
                          ~~~~~~~~~~~~~~~~

src/components/NotificationItem.tsx:54:35 - error TS2345: Argument of type 'string' is not assignable to parameter of 
type 'number'.

54       onClick={() => onMarkAsRead(notification.id)}     
                                     ~~~~~~~~~~~~~~~       

src/components/NotificationItem.tsx:94:40 - error TS2345: Argument of type 'string' is not assignable to parameter of 
type 'number'.

94               onClick={(e) => onAccept(notification.id, 
e)}
                                          ~~~~~~~~~~~~~~~  

src/components/NotificationItem.tsx:101:41 - error TS2345: 
Argument of type 'string' is not assignable to parameter of type 'number'.

101               onClick={(e) => onDecline(notification.id, e)}
                                            ~~~~~~~~~~~~~~~
src/components/NotificationItem.tsx:131:20 - error TS2345: 
Argument of type 'string' is not assignable to parameter of type 'number'.

131           onDelete(notification.id);
                       ~~~~~~~~~~~~~~~

src/components/PodcastCard.tsx:4:25 - error TS2307: Cannot 
find module '@/app/magna-podcast/constants' or its corresponding type declarations.

4 import { Podcast } from '@/app/magna-podcast/constants'; 
                          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  

src/components/PodcastCard.tsx:27:29 - error TS7006: Parameter 'tag' implicitly has an 'any' type.

27           {podcast.tags.map(tag => (
                               ~~~

src/components/PodcastPlayer.tsx:4:25 - error TS2307: Cannot find module '@/app/magna-podcast/constants' or its corresponding type declarations.

4 import { Podcast } from '@/app/magna-podcast/constants'; 
                          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  

src/components/PostInteractionBar.tsx:5:15 - error TS2305: 
Module '"@/types"' has no exported member 'Comment'.       

5 import type { Comment } from '@/types';
                ~~~~~~~

src/components/PostInteractionBar.tsx:176:36 - error TS7006: Parameter 'reply' implicitly has an 'any' type.

176               {comment.replies.map(reply => (
                                       ~~~~~

src/components/ProjectPostDetail.tsx:34:12 - error TS18048: 'post.tags' is possibly 'undefined'.

34           {post.tags.map(tag => (
              ~~~~~~~~~

src/components/ProjectPostDetails.tsx:34:16 - error TS18048: 'post.tags' is possibly 'undefined'.

34               {post.tags.map(tag => (
                  ~~~~~~~~~

src/components/ProjectsTab.tsx:5:10 - error TS2305: Module 
'"@/app/user-profile/data"' has no exported member 'Project'.

5 import { Project } from '@/app/user-profile/data';       
           ~~~~~~~

src/components/ProjectsTab.tsx:27:33 - error TS7006: Parameter 'tag' implicitly has an 'any' type.

27               {project.tags.map(tag => (
                                   ~~~


Found 45 errors in 18 files.

Errors  Files
     1  src/components/ConnectionsTab.tsx:6
     1  src/components/CourseCard.tsx:4
     3  src/components/CourseCurriculum.tsx:3
     1  src/components/CourseHeader.tsx:3
     3  src/components/EnrollmentCard.tsx:3
    14  src/components/FeedItem.tsx:57
     1  src/components/InstructorBio.tsx:3
     2  src/components/JobCard.tsx:51
     2  src/components/JobPostDetail.tsx:51
     2  src/components/JobPostDetails.tsx:112
     1  src/components/MagnaMessageBubble.tsx:9
     5  src/components/NotificationItem.tsx:14
     2  src/components/PodcastCard.tsx:4
     1  src/components/PodcastPlayer.tsx:4
     2  src/components/PostInteractionBar.tsx:5
     1  src/components/ProjectPostDetail.tsx:34
     1  src/components/ProjectPostDetails.tsx:34
     2  src/components/ProjectsTab.tsx:5

npx tsc --noEmit     