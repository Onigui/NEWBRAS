/**
 * Elencos reais copiados do FotMob em 23/11/2026, um bloco por clube ("## slug do clube").
 * Formato de cada linha: nome|posições|número|idade|país (em inglês)|valor de mercado.
 * Linhas começando com "#" são comentários. A conversão para jogadores do jogo fica em ./fotmob.ts.
 */
export const ELENCOS_MLS = `
# FotMob, elencos da MLS 2026 (consulta em 23/11/2026). Nome|posições|número|idade|país|valor
## chicago-fire
Chris Brady|GK|1|22|United States|€2.2M
Jeffrey Gal|GK|25|33|United States|€50K
Josh Cohen|GK|44|34|United States|€69K
Leonardo Barroso|RB, LB|2|21|Portugal|€1.2M
Jonathan Dean|RB, LB|24|29|United States|€480K
Omar González|CB||38|United States|€100K
Jack Elliott|CB|3|31|England|€1.5M
Mbekezeli Mbokazi|CB|4|21|South Africa|€10M
Sam Rogers|CB|5|27|United States|€270K
Andreas Hanche-Olsen|CB|21|29|Norway|€1.7M
Andrew Gutman|LB|15|30|United States|€930K
Noah Allen|LB, CB, LM|32|22|Greece|€1.9M
Johan Gómez|RWB, LW, ST, AM|18|25|United States|€590K
André Franco|DM|10|28|Portugal|€710K
Oscar Pineda|DM, CM|65|18|United States|
Anton Salétros|CM, DM|6|30|Sweden|€1.5M
Robin Lod|CM, ST, AM, RM|17|33|Finland|€710K
Mauricio Pineda|CM, DM|22|29|United States|€710K
Anzor Mekvabishvili|CM, DM|23|25|Georgia|€1.8M
Sergio Oregel|CM, DM|35|21|United States|€1.4M
Djé D'Avilla|CM, DM|42|23|Ivory Coast|€3.9M
Dawid Poręba|AM, DM, CM|29|23|United States|€180K
Robert Turdean|AM, ST, RW, LW|37|16|United States|
Philip Zinckernagel|RW, RM|11|31|Denmark|€2.1M
Puso Dithejane|LW, RW|12|22|South Africa|€790K
Jonathan Bamba|LW, LM|19|30|Ivory Coast|€2.1M
Maren Haile-Selassie|ST, LW, LM, AM, CM, RW|7|27|Switzerland|€1.1M
Chris Mueller|ST|8|30|United States|€53K
Robert Lewandowski|ST|9|38|Poland|€6.9M
Dean Boltz|ST, AM|28|20|United States|€550K
## charlotte
Kristijan Kahlina|GK|1|34|Croatia|€516.4k
Tyler Miller|GK|21|33|United States|€119.9k
Isaac Walker|GK|42|26|United States|€108.4k
Nathan Byrne|RB|14|34|England|€146.2k
Will Cleary|RB|35|23|United States|€246.3k
Tim Ream|CB|3|39|United States|€130.8k
Andrew Privett|CB|4|26|United States|€783.5k
Henry Kessler|CB|22|28|United States|€696.6k
Andrew Johnson|CB|34|22|Saint Vincent and The Grenadines|
Jack Neeley|CB, RB|39|21|United States|€494.3k
Morrison Agyemang|CB|44|21|Ghana|€1.1m
Harry Toffolo|LB|15|31|England|€1.2m
David Schnegg|LB|23|28|Austria|€699.1k
Mikah Thomas|LB|24|21|United States|
Brandt Bronico|DM, AM, CM|13|31|United States|€710k
Djibril Diani|DM, CM|28|28|France|€495.4k
Ashley Westwood|CM, DM|8|36|England|€115.7k
Luca de la Torre|CM, DM|17|28|United States|€1.5m
Baye Coulibaly|CM, DM|20|20|Mali|€1.7m
Aron John|CM|48|20|United States|€686.2k
Pep Biel|AM, CM, RW|16|30|Spain|€3.3m
Liel Abada|RW, LW|11|25|Israel|€2.4m
Rodolfo Aloko|RW, ST, LW|37|19|Benin|€1.5m
Brian Romero|RW|41|20|United States|€482.8k
Nathan Richmond|RW, CM|71|22|United States|
Allan Saint-Maximin|LW, AM, LM|10|29|France|€10.1m
Tyger Smalls|LW|25|24|England|€161.6k
Nimfasha Berchimas|LW, RW, LM|27|18|United States|€1.8m
Archie Goodwin|ST|7|21|Australia|€1m
Idan Toklomati|ST|9|22|Israel|€3.2m
## new-york-red-bulls
Tobias Szewczyk|GK||17|United States|
AJ Marcucci|GK|1|27|United States|€130K
Ethan Horvath|GK|34|31|United States|€510K
John McCarthy|GK|77|34|United States|€50K
Jahkeele Marshall-Rutty|RB|3|22|Canada|€1.7M
Juan Mina|RB|20|22|Colombia|
Davi Alexandre|CB||19|United States|€430K
Justin Che|CB|2|22|United States|€1M
Robert Voloder|CB|6|25|Germany|€590K
Dylan Nealis|CB, RB|12|28|United States|€1M
Julián Bazán|CB|14|20|Colombia|€610K
Tim Parker|CB|26|33|United States|€65K
Connor Faello|LB||18|United States|€640K
Omar Valencia|LB|5|22|Panama|€260K
Matthew Dos Santos|LB|56|18|United States|€6.2M
Devin Padelford|LB, CB, LWB|59|23|United States|€220K
David Ruiz|CM|8|22|Honduras|€1.3M
Emil Forsberg|CM, AM|10|35|Sweden|€730K
Adri Mehmeti|CM, DM|15|17|United States|€6.3M
Mohammed Sofo|CM, LW|37|21|Ghana|€860K
Ronald Donkor|CM, AM|48|21|Ghana|€1.9M
Sekou Kone|CM, AM, DM|60|19|Mali|
Aiden Jarvis|CM, DM||19|United States|
Nehuén Benedetti|AM, CM|39|21|Argentina|€470K
Andy Rojas|AM, CM, LW, RW|70|20|Costa Rica|€1.2M
Pedro Castro|AM|88|19|Brazil|
Cade Cowell|RW, LW|7|23|United States|€2.1M
Cameron Harper|RW|17|24|United States|€340K
Rafael Mosquera|RW|79|21|Panama|€560K
Jorge Ruvalcaba|LW, RW|11|25|Mexico|€5.9M
Tanner Rosborough|LW|66|18|United States|€1M
Dennis Nelich|LW, LM|92|18|United States|€970K
Eric Maxim Choupo-Moting|ST|13|37|Cameroon|€560K
Julian Hall|ST, LW|16|18|United States|€10M
Mijahir Jiménez|ST|91|19|Panama|€760K
## new-england
Matt Turner|GK|30|32|United States|€1.5m
Donovan Parisian|GK|33|22|United States|
JD Gunn|GK|73|26|Panama|€61.2k
Matt Polster|RB, DM|8|33|United States|€262.2k
Ilay Feingold|RB|12|22|Israel|€2.3m
Cody Baker|RB|15|22|United States|€259.4k
Damario McIntosh|RB|19|19|Jamaica|
Mamadou Fofana|CB|2|28|Mali|€1.5m
Tanner Beason|CB|4|29|United States|€227k
Tylon Smith|CB|6|21|South Africa|€195.4k
Benjamin Sammer|CB||21|Austria|€107.9k
Ethan Kohler|CB, DM|22|21|United States|€831.2k
Joshua Wynder|CB|66|21|United States|€1.1m
Andrew Farrell|CB|88|34|United States|€50k
Will Sands|LB, RB|23|26|United States|€311.8k
Brooklyn Raines|DM, CM|21|21|United States|€2.1m
Jackson Yueill|CM, DM|14|29|United States|€707.5k
Javaun Mussenden|CM, DM, RB, AM|57|19|United States|
Judah Siqueira|CM, AM, RW|65|17|United States|
Alhassan Yusuf|CM, DM, LW|80|26|Nigeria|€2m
Diego Fagúndez|CM|77|31|Uruguay|€495.8k
Carles Gil|AM, CM|10|33|Spain|€791.8k
Cristiano Oliveira|RW, CM, RM, AM|35|18|United States|€942.9k
Jack Harrison|RW, LW|11|29|England|€8.1m
Luca Langoni|RW|41|24|Argentina|€4.4m
Griffin Yow|LW, RW|7|24|United States|€1.7m
Peyton Miller|LW, RW, LB|25|18|United States|€4.9m
Leonardo Campana|ST|9|26|Ecuador|€1.5m
Dániel Gazdag|ST, LW|16|30|Hungary|€1.7m
Marcos Zambrano|ST, LW|17|21|United States|€231.5k
Wilson Harris|ST|27|26|United States|€206.2k
Dor Turgeman|ST|99|22|Israel|€5.5m
## nycfc
Maclean Learned|GK||24|United States|
Greg Ranjitsingh|GK|18|33|Trinidad and Tobago|€50K
Tomás Romero|GK|30|25|El Salvador|€110K
Matt Freese|GK|49|28|United States|€1.4M
Tayvon Gray|RB|24|24|Jamaica|€2.1M
Mitja Ilenič|RB, RM|35|21|Slovenia|€910K
Drew Baiera|RB|38|19|United States|€810K
Matt Miazga|CB|3|31|United States|€730K
Thiago Martins|CB|13|31|Brazil|€1.2M
Maxwell Murray|CB|23|24|United States|
Raul|CB, LB|34|27|Brazil|€980K
Kamran Acito|CB|45|22|United States|
James Sands|CB, CM, DM|6|26|United States|€5.1M
Nico Cavallo|LB|2|24|United States|
Kevin O'Toole|LB, LWB|22|27|Ireland|€750K
Kai Trewin|DM, CB, CM, RWB|5|25|Australia|€1.4M
Andrés Perea|DM, CM, AM, LW|8|25|United States|€1.7M
Aiden O'Neill|DM, CM|21|28|Australia|€1.8M
Cooper Flax|DM, CM, AM, LW, LM|27|22|United States|
Peter Molinari|DM, CM|71|17|United States|
Kevin Pierre|CM, DM|15|23|United States|€190K
Jonathan Shore|CM, DM|32|19|United States|€1.8M
Keaton Parks|CM, DM|55|29|United States|€1.4M
Maxi Moralez|AM, ST|10|39|Argentina|€85K
Máximo Carrizo|AM, RW, ST|29|18|United States|€890K
Agustín Ojeda|RW, RM|26|22|Argentina|€6.5M
Bénie Traoré|LW, RW, ST, LM, RM|9|23|Ivory Coast|€9.8M
Hannes Wolf|LW|17|27|Austria|€3.9M
El Hadji Samb|LW, RW, ST|75|16|United States|
Arnau Farnós|LW|87|23|Spain|€100K
Malachi Jones|LW|88|23|Sierra Leone|€180K
Nicolás Fernández|ST, AM, CM, RW|7|26|Argentina|€9.5M
Talles Magno|ST|11|24|Brazil|€3.4M
Alonso Martínez|ST|16|28|Costa Rica|€3.9M
Luighi|ST|20|20|Brazil|€7.9M
Jacob Arroyave|ST|47|18|United States|
## portland-timbers
Trey Muse|GK|25|27|United States|€58K
Hunter Sulte|GK|26|24|United States|€200K
James Pantemis|GK|41|29|Canada|€510K
Brandon Bye|RB|5|30|United States|€1M
Ronald Hernández|RB, CB|12|29|Venezuela|€69K
Eric Miller|RB|15|33|United States|€50K
Sawyer Jura|RB|16|20|United States|
Juan Mosquera|RB|29|24|Colombia|€2M
Joel Waterman|CB|2|30|Canada|€940K
Kamal Miller|CB|4|29|Canada|€1.2M
Alex Bonetig|CB|6|24|Australia|€1.3M
Zac McGraw|CB|18|29|Canada|€50K
Finn Surman|CB|20|23|New Zealand|€2.2M
Ian Smith|LB|23|24|United States|€190K
Jimer Fory|LB|27|24|Colombia|€1.3M
Diego Chará|DM, CM|21|40|Colombia|€60K
Eric Izoita|DM, CM, AM|73|19|United States|€800K
David Da Costa|CM, AM, ST|10|25|Portugal|€4.7M
Cole Bassett|CM, DM, AM|17|25|United States|€2.3M
José Caicedo|CM, DM|30|24|Colombia|€3.8M
Joao Ortiz|CM, DM|80|30|Ecuador|€940K
Ariel Lassiter|RW, LW|7|32|Costa Rica|€110K
Antony|LW, RW|11|25|Brazil|€2.2M
Alexander Aravena|LW|28|24|Chile|€2.3M
Kristoffer Velde|LW, RW|99|27|Norway|€4.3M
Vincent Janssen|ST|14|32|Netherlands|€2.1M
Omir Fernandez|ST|22|27|United States|€520K
Gage Guerra|ST|88|23|United States|€100K
## la-galaxy
Novak Mićović|GK|1|25|Serbia|€190K
James Marcinkowski|GK|12|29|United States|
Brady Scott|GK|31|27|United States|€62K
Calegari|RB, RM|2|24|Brazil|€1.8M
Harbor Miller|RB, LW, RM|26|19|United States|€1.5M
Maya Yoshida|CB|4|38|Japan|€60K
Jakob Glesnes|CB|5|32|Norway|€1.3M
Justin Haak|CB, CM, DM|15|25|United States|€1.5M
Chris Rindov|CB|20|25|United States|€180K
Emiro Garcés|CB|25|25|Colombia|€610K
Julián Aude|LB|3|23|Argentina|€1.6M
John Nelson|LB|14|28|United States|€500K
Riley Dalgado|LB, LM|50|20|United States|
Sergi Roberto|DM, CM|6|34|Spain|€710K
Pablo Ruiz|DM, CM|17|27|Argentina|€470K
Elijah Wynder|DM, CM|22|23|United States|€950K
Brett Phan|DM, CM|90|18|United States|
Lucas Sanabria|CM, DM, AM|8|22|Uruguay|€3.7M
Riqui Puig|CM|10|27|Spain|€8.7M
Isaiah Parente|CM, DM|16|26|United States|€110K
Troy Elgersma|LM, DM, LW, CM, RW|76|22|United States|
Marco Reus|AM, ST, CM|18|37|Germany|€860K
Vicente Garcia|RW, DM, RM, AM, CM|45|16|United States|
Erik Thommy|LW, CM, AM, DM|27|32|Germany|€460K
Hirving Lozano|LW, RW|11|31|Mexico|€1.9M
Robert Taylor|LW, RW|21|32|Finland|€510K
Joseph Paintsil|LW, RW, ST|28|28|Ghana|€4.2M
Kyogo Furuhashi|ST|7|31|Japan|€1.1M
Julian Placias|ST|57|20|United States|€930K
João Klauss|ST|99|29|Brazil|€1.3M
## inter-miami
# ESPN (posições detalhadas completadas à mão; sem valor de mercado)
Luis Barraza|GK|13|30|United States|
Rocco Ríos Novo|GK|34|24|Argentina|
Dayne St. Clair|GK|97|29|Canada|
Gonzalo Luján|CB|2|25|Argentina|
Sergio Reguilón|LB||29|Spain|
Facundo Mura|RB|4|27|Argentina|
Fricio Caicedo|Defender||18|Ecuador|
Ian Fray|RB|17|24|Jamaica|
Santiago Morales|LB||25|Argentina|
Tyler Hall|Defender||20|United States|
Maximiliano Falcón|CB||29|Uruguay|
Israel Boatwright|Defender||21|Dominican Republic|
Daniel Sumalla|Defender||19|United States|
Cesar Abadia-Reda|Defender||20|United States|
Casemiro|DM, CM||34|Brazil|
Rodrigo De Paul|CM, DM|7|32|Argentina|
Telasco Segovia|AM, CM||23|Venezuela|
David Ayala|DM, CM||24|Argentina|
Yannick Bright|CM, DM||25|Italy|
Ian Urkidi|Midfielder||19|United States|
Preston Plambeck|Midfielder||20|United States|
Alexander Shaw|Midfielder||18|United States|
Luis Suárez|ST|9|39|Uruguay|
Lionel Messi|RW, ST, AM|10|39|Argentina|
Riquelme|Attacker||20|Brazil|
Germán Berterame|ST||27|Mexico|
Tadeo Allende|RW, ST||27|Argentina|
Mateo Silvetti|LW, RW||20|Argentina|
Idoh Zeltzer-Zubida|Attacker||21|United States|
Diego Rey|Attacker||20|United States|
Lovens Delinois|Attacker||22|Haiti|
Dániel Pintér|Attacker||19|United States|
## fc-cincinnati
Connor Dale|GK|16||United States|
Evan Louro|GK|13|30|United States|€50K
Roman Celentano|GK|18|26|United States|€1.7M
Fabian Mrozek|GK|93|23|Poland|€200K
Nick Hagglund|CB|4|34|United States|€160K
Julián Malatini|CB|6|25|Argentina|€1.2M
Miles Robinson|CB|12|29|United States|€2M
Teenage Lingani Hadebe|CB|15|31|Zimbabwe|€330K
Kyle Smith|CB|24|34|United States|€52K
Ayoub Lajhar|CB, LWB, LB, LM|55|22|Libya|€240K
Andrei Chirilă|CB|88|18|United States|€760K
Samuel Gidi|CB, CM, DM|11|22|Slovakia|€2.1M
Tyrell Malacia|LB, LWB, LM|3|27|Netherlands|€1.7M
Bryan Ramírez|LWB, LM, RM|29|26|Ecuador|€2M
Brian Anunga|DM, CM|27|30|Cameroon|€230K
Obinna Nwobodo|CM, DM|5|29|Nigeria|€1.5M
Evander Ferreira|CM, AM, ST, LW|10|28|Brazil|€14M
Pavel Bucha|CM, RWB, RM, DM|20|28|Czech Republic|€1.7M
Gerardo Valenzuela|CM, DM, ST|22|22|United States|€1.9M
José Martínez|CM, DM|70|32|Venezuela|
Alvas Elvis Powell|RM|2|32|Jamaica|€50K
David Douděra|RM, RWB|23|28|Czech Republic|€1.8M
Ender Echenique|RM, RWB, LWB, RW, LM|66|22|Venezuela|€1.7M
Kenji Mboma Dem|ST, AM, LM, LWB|17|24|France|€580K
Ademar Chávez|ST, RM, AM, RW, LW|30|17|United States|€800K
Kévin Denkey|ST|9|25|Togo|€16M
Kristian Fletcher|ST|14|21|United States|€390K
Tom Barlow|ST||31|United States|€140K
Ștefan Chirilă|ST, AM, LW, RW, CM|19|19|Romania|
Ayoub Jabbari|ST|99|26|Morocco|€1.1M
## nashville-sc
Joe Willis|GK|1|38|United States|€50K
Xavier Valdez|GK|13|22|Dominican Republic|€100K
William Joshua Mackay|GK|95|18|United States|
Brian Schwake|GK|99|25|United States|€660K
Josh Bauer|RB, LB|22|28|United States|€71K
Julian Gaines|RB, CB|29|24|United States|€240K
Andy Nájar|RB|31|33|Honduras|€74K
Malachi Molina|RB, LB|35|20|Jamaica|
Maxwell Woledzi|CB|3|25|Ghana|€2.4M
Jeisson Palacios|CB|4|32|Colombia|€330K
Jack Maher|CB|5|27|United States|€1.4M
Thomas Williams|CB|21|22|United States|€270K
Daniel Lovitz|LB|2|35|United States|€52K
Reed Baker-Whiting|LB, RB|27|21|United States|€1.1M
Owen Presthus|RWB, RM, LB|17|20|United States|€390K
Bryan Acosta|CM, DM|6|32|Honduras|€120K
Patrick Yazbek|CM, DM|8|24|Australia|€2.4M
Matthew Corcoran|CM, DM|16|20|United States|€1.9M
Edvard Tagseth|CM, DM|20|25|Norway|€2.1M
Famara Camara|CM|26|21|Senegal|€1.8M
Jordan Knight|RM, LW, ST|23|24|Canada|€150K
Alex Muyl|LM, CM, LW|19|31|United States|€1M
Shak Mohammed|RW, CM, RM|14|23|Ghana|€280K
Cristian Espinoza|RW, RM|7|31|Argentina|€2.2M
Elias Saad|LW, LM, ST, AM|11|26|Tunisia|€1.4M
Ahmed Qasem|LW, LM, RW, ST, RM, CM|37|23|Iraq|€3.6M
Sam Surridge|ST|9|28|England|€8.1M
Hany Mukhtar|ST, AM, CM, LW|10|31|Germany|€3.5M
Zidane Yáñez|ST|15|18|Chile|
Warren Madrigal|ST, LW|41|22|Costa Rica|€1.5M
## orlando-city
Javier Otero|GK|12|24|Venezuela|€130K
Tristan Himes|GK|40|23|United States|
Maxime Crépeau|GK|71|32|Canada|€1M
Zakaria Taifi|RB, RWB, LB|19|21|United States|€340K
Griffin Dorsey|RB, RWB, RM|24|27|United States|€960K
Adrián Marín|CB, LB|3|29|Spain|€660K
David Brekalo|CB|4|27|Slovenia|€2M
Robin Jansson|CB|6|35|Sweden|€170K
Nolan Miller|CB|21|22|United States|€190K
Iago|CB|57|21|Brazil|€1.6M
Vinícius Nogueira|LB|27|24|Brazil|€1.1M
Clovis Archange|LB, CB|33|18|United States|
Bernardo Rhein Goncalves|LB|44|19|United States|€840K
Wilder Cartagena|DM, CM, CB|16|32|Peru|€470K
Ignacio Gómez|DM, CM|80|20|Argentina|€440K
Luis Otávio|CM, DM|5|19|Brazil|€4.5M
Braian Ojeda|CM, DM|8|26|Paraguay|€2.3M
Tiago Carvalho|CM, LW, ST, LM|11|21|Brazil|€4.4M
Eduard Atuesta|CM, DM|20|29|Colombia|€2M
Joran Gerbet|CM, DM|35|25|France|€180K
Dylan Judelson|CM, DM|41|18|United States|
Marco Pašalić|RM, RW, ST, AM|87|26|Croatia|€6.1M
Iván Angulo|LM, LWB, RW, LW, RB, RM, LB|77|27|Colombia|€1.7M
Harvey Sarajian|LM, LW, ST, RW|23|21|United States|€500K
Issah Haruna|RW, AM, DM, RM|38|22|Ghana|
Gustavo Caraballo|RW, ST, RM|65|18|Venezuela|€950K
Tyrese Spicer|LW|14|25|Trinidad and Tobago|€390K
Pedro Leão|ST||20|Brazil|
Antoine Griezmann|ST, AM|7|35|France|€6.8M
Daryl Dike|ST|9|26|United States|€680K
Martín Ojeda|ST, AM, LW|10|27|Argentina|€9.4M
Justin Ellis|ST, AM, RM, RW|22|19|United States|€1.2M
## lafc
Hugo Lloris|GK|1|39|France|€480K
Thomas Hasal|GK|12|27|Canada|€50K
Cabral Carter|GK|31|22|United States|€120K
Sergi Palencia|RB, RWB|14|30|Spain|€1.4M
Ryan Raposo|RB|21|27|Canada|€270K
Ryan Hollingshead|RB, LB, RM|24|35|United States|€170K
Ryan Porteous|CB|5|27|Scotland|€1.9M
Lorenzo Dellavalle|CB|15|22|Italy|€150K
Aaron Long|CB|33|34|United States|€290K
Christian Díaz|CB|44|20|United States|
Kenneth Nielsen|CB|45|24|United States|€150K
Nkosi Tafari|CB|91|29|United States|€970K
Eddie Segura|LB, CM, CB|4|29|Colombia|€1.3M
Evgen Cheberko|LB, CB|23|28|Ukraine|€480K
Igor Jesus|DM|6|23|Brazil|€2.1M
Marco Delgado|DM, CM|8|31|United States|€1.5M
Timothy Tillman|CM, AM, RW|11|27|United States|€1.9M
Sergio Vasquez|CM, DM, RW, AM|20|22|Ecuador|
Jude Terry|CM, DM, AM|22|18|United States|€1.6M
Mathieu Choinière|CM, DM|66|27|Canada|€740K
Leo Walta|CM, RW, AM|81|23|Finland|€2.2M
Armindo Sieb|RW, ST, LW|9|23|Germany|€1.9M
Jacob Shaffelburg|RW, LW, LM, LWB|18|26|Canada|€1.3M
Tyler Boyd|RW|19|31|United States|€120K
Thayllon|RW, AM, RM|43|20|Brazil|€1.8M
Tommy Mihalić|LW, RW|90|24|Croatia|€190K
Denis Bouanga|LW, ST, AM, LM|99|32|Gabon|€5.3M
Heung-Min Son|ST, AM|7|34|South Korea|€12M
Jeremy Ebobisse|ST|17|29|United States|€550K
## columbus-crew
Nicholas Hagen|GK|1|30|Guatemala|€50K
Evan Bush|GK|24|40|United States|€50K
Patrick Schulte|GK|28|25|United States|€2.4M
Stanislav Lapkes|GK|41|20|Belarus|
Luke Pruter|GK|54|25|United States|€150K
Andrés Herrera|RB, RM|2|28|Argentina|€950K
Brooks Lennon|RB, RM, LM|11|29|United States|€750K
Eric Bailly|CB|3|32|Ivory Coast|€450K
Rudy Camacho|CB|4|35|France|€50K
Cesar Ruvalcaba|CB|12|25|United States|€130K
Sean Zawadzki|CB, LB, DM|25|26|United States|€1.7M
Steven Moreira|CB, RB|31|32|Cape Verde|€700K
Malte Amundsen|LB, CB|18|28|Denmark|€1.5M
Tristan Brown|LWB, LM, LB|22|19|United States|€670K
Dylan Chambost|CM, DM|7|29|France|€1.4M
Amar Sejdić|CM|14|29|United States|€50K
Taha Habroune|CM, ST, LM, AM, RM, DM, RW|16|20|United States|€5.8M
Sékou Bangoura|CM, DM|17|24|Guinea|€710K
André Gomes|CM, DM|20|33|Portugal|€1.4M
Tarun Karumanchi|CM, DM|50|23|United States|€140K
Mohamed Farsi|RM, RB, RWB|23|26|Algeria|€1.2M
Kevin Gbamblé|RM, LW, AM, LM, ST|39|19|United States|
Anass Zaroury|LM, LW, AM, RW, LWB|21|26|Morocco|€5.9M
Lautaro Giaccone|LM, LW|26|25|Argentina|€850K
Cole Mrowka|AM|29|20|Philippines|€160K
Santiago Rodríguez|RW, LW, CM, AM, LM|8|26|Uruguay|€5.5M
Wessam Abou Ali|ST|9|27|Palestine|€5.1M
Brais Méndez|ST, AM, RW|10|29|Spain|€5.6M
Jamal Thiaré|ST|19|33|Senegal|€93K
Gonzalo Tapia|ST, RW|33|24|Chile|€3.6M
Chase Adams|ST|46|18|United States|€1M
Josef Martínez|ST|77|33|Venezuela|€790K
## toronto-fc
Luka Gavran|GK|1|26|Canada|€660K
William Yarbrough|GK|23|37|United States|€50K
Kobe Franklin|RB, LB, RWB|19|23|Canada|€400K
Jackson Gilman|RB, CB, CM, LB|38|22|United States|€250K
Zane Monlouis|CB|12|23|Jamaica|€420K
Benjamín Kuščević|CB|13|30|Chile|€1M
Nicksoen Gomis|CB|15|24|France|€170K
Walker Zimmerman|CB|25|33|United States|€940K
Matheus Pereira|LB|3|25|Brazil|€1M
Richie Laryea|LB, RB, CB, DM|22|31|Canada|€510K
Raheem Edwards|LB, LW|44|31|Canada|€230K
Alonso Coello|DM, CM|14|27|Spain|€780K
Jonathan Osorio|DM, CM|21|34|Canada|€450K
Niklas Dorsch|CM, DM|6|28|Germany|€2.1M
Nelson Palacio|CM, DM|8|25|Colombia|€610K
Djordje Mihailović|CM, AM, LW|10|28|United States|€4.1M
Jules-Anthony Vilsaint|RM|99|23|Canada|€160K
Theodor Corbeanu|RW, RM|7|24|Canada|€1.2M
Malik Henry|RW, RM|78|24|Canada|€210K
Dániel Sallói|LW, LM, RW, AM, CM|20|30|Hungary|€1.3M
Alejandro Piedrahita|LW, RW|27|24|Colombia|€770K
Joshua Sargent|ST|9|26|United States|€17M
Derrick Etienne|ST, LW, RW, AM|11|29|Haiti|€320K
Emilio Aristizábal|ST|17|21|Colombia|€970K
Lewis Morgan|ST, LW||30|Scotland|€580K
## philadelphia-union
Andre Blake|GK|18|35|Jamaica|€100K
George Marks|GK|31|27|United States|€200K
Andrew Rick|GK|76|20|United States|€450K
Giovanny Sequera|RB, RM, LB, LM|38|20|Venezuela|€620K
Francis Westfield|RB, LB|39|20|United States|€3.5M
Kaiden Moore|CB, LB||19|United States|
Geiner Martínez|CB|2|23|Colombia|€460K
Japhet Sery Larsen|CB|5|26|Denmark|€1M
Nathan Harriel|CB, RB, LB|26|25|United States|€1.2M
Neil Pierre|CB|44|19|United States|€2.6M
Finn Sundstrom|CB|66|20|United States|€540K
Ben Bender|LB|16|25|United States|€130K
Philippe Ossibadjouo|LB|20|21|Gabon|
Kai Wagner|LB|27|29|Germany|€1.9M
Jordan Romaine Griffin|LB|68|18|United States|€800K
Jovan Lukić|CM|4|24|Serbia|€4.8M
Jesús Bueno|CM|8|27|Venezuela|€250K
Jeremy Rafanello|CM|14|26|United States|€92K
Danley Jean Jacques|CM, DM, RM|21|26|Haiti|€1.7M
Cavan Sullivan|RM, LM, RW|6|17|United States|€14M
Alejandro Bedoya|RM|11|39|United States|€50K
Quinn Sullivan|RM, LM|33|22|United States|€5.2M
Indiana Vassilev|LM, RM|19|25|United States|€1.8M
Agustín Anello|ST, LM|28|24|United States|€1.3M
Bruno Damiani|ST|9|24|Uruguay|€1.7M
Milan Iloski|ST, RM, LM|10|27|United States|€2M
Ezekiel Alladoh|ST|23|21|Ghana|€4.9M
Malik Jakupović|ST|51|17|United States|€1M
Sal Olivas|ST|55|20|United States|€590K
## vancouver-whitecaps
Yohei Takaoka|GK|1|30|Japan|€1.6M
Édier Ocampo|RB|18|23|Colombia|€3.9M
Rui Modesto|RB, CB, RWB|70|27|Angola|€760K
Mathías Laborda|CB, LB, RB|2|27|Uruguay|€1.8M
Ranko Veselinović|CB|4|27|Serbia|€1.3M
Ralph Priso-Mbongue|CB|6|24|Canada|€820K
Belal Halbouni|CB|12|26|Syria|€130K
Mihail Gherasimencov|CB, LB|29|21|Moldova|€700K
Tristan Blackmon|CB|33|30|United States|€1.9M
Sam Adekugbe|LB|3|31|Canada|€76K
Tate Johnson|LB|28|21|United States|€4.7M
Oliver Larraz|DM|8|25|United States|€600K
Andrés Cubas|DM, CM|20|30|Paraguay|€2.2M
Aleksa Cvetković|CM, AM, DM|23|21|Serbia|€3.4M
Thomas Müller|AM|13|37|Germany|€2.3M
Ryan Gauld|AM, RW|25|30|Scotland|€2M
Jeevan Badwal|RW, DM, AM|59|20|Canada|€3.8M
Cheikh Sabaly|RW, LW|7|27|Senegal|€1.9M
Emmanuel Sabbi|RW, LW|11|28|United States|€1.5M
Kwasi Poku|RW|22|23|Canada|€390K
Bruno Caicedo|LW|14|21|Ecuador|€2.1M
Kenji Cabrera|LW, RW|17|23|Peru|€1.3M
Yadaly Diaby|LW, LM, ST|77|26|Guinea|€830K
Rayan Elloumi|ST|19|19|Tunisia|€1.8M
Brian White|ST|24|30|United States|€3.8M
## dc-united
Sean Johnson|GK|1|37|United States|€103.3k
Grant Leveillé|GK|20|18|Haiti|
Alex Bono|GK|26|32|United States|€50k
Kimito Nono|RB, RM|2|24|Japan|€1.2m
Silvan Hefti|RB|5|28|Switzerland|€264k
Conner Antley|RB, RWB|12|31|United States|€50k
Lucas Bartlett|CB|3|29|United States|€984.7k
Sean Nealis|CB|13|29|United States|€448.9k
Kye Rowles|CB, LWB|15|28|Australia|€689.9k
Nikola Marković|CB|27|22|Canada|€288.4k
Keisuke Kurokawa|LB|6|29|Japan|€733.9k
Andre Dozzell|DM, CM, CB|21|27|England|€1.5m
Matti Peltola|CM|4|24|Finland|€1.3m
Brandon Servania|CM|23|27|Puerto Rico|€255.2k
Kamil Castillo|Midfielder|40|16|Dominican Republic|
Jared Stroud|RM|8|30|United States|€495.8k
Peglow|LM, CM, ST|7|24|Brazil|€993.3k
Hosei Kijima|LM|77|24|Japan|€146.8k
Oscar Avilez|Attacker|32|16|United States|
Jackson Hopkins|ST, RM, CM, AM, LM, RW|25|22|United States|€1.4m
Tai Baribo|ST|9|28|Israel|€5.2m
Louis Munteanu|ST, RW, LW|11|24|Romania|€6.1m
Gabriel Segal|ST|14|25|United States|€146.6k
Nathan Ordaz|ST, RW, AM|22|22|El Salvador|€1.8m
Gavin Turner|ST|48|19|United States|€398.1k
## cf-montreal
Sébastian Breza|GK|1|28|Canada|€79K
Thomas Gillier|GK|31|22|Chile|€1.5M
Emil Gazdov|GK|33|23|Canada|€100K
Samsy Keita|GK|41|17|Canada|
Brayan Ceballos|RB, CB|3|25|Colombia|€1.2M
Bode Hidalgo|RB|19|24|United States|€1.1M
Dawid Bugaj|RB, RWB|27|22|Poland|€430K
Jalen Neal|CB, RB|2|23|United States|€850K
Brayan Vera|CB, LB|4|27|Colombia|€940K
Brandan Craig|CB|5|22|United States|€170K
Efraín Morales|CB|24|22|Bolivia|€540K
Josh Nteziryayo|CB|36|18|Canada|
Luca Petrasso|LB, LWB|13|26|Canada|€620K
Viktor Radojević|LB|28|22|Serbia|€1.3M
Daniel Pereira|DM, CM|7|26|Venezuela|€1.7M
Ivan Losenko|DM|26|22|Ukraine|€480K
Samuel Piette|CM, DM|6|32|Canada|€280K
Matthew Longstaff|CM, DM|8|26|England|€740K
Fabian Herbers|CM, AM|21|33|Germany|€69K
Victor Loturi|CM, DM|22|25|Canada|€550K
Frankie Amaya|CM|25|26|United States|€750K
Olger Escobar|AM, CM, RW|29|20|Guatemala|€520K
Wiki Carmona|RW, AM, CM, RM, LW|16|23|Venezuela|€2.2M
Dante Sealy|RW, LW|17|23|Trinidad and Tobago|€1.1M
Gennadiy Synchuk|RW|18|20|Ukraine|€4.7M
Noah Streit|LW, RW, RM|23|21|Switzerland|€850K
Prince Osei Owusu|ST|9|29|Ghana|€2.5M
Alexis Sánchez|ST, AM, LW|10|37|Chile|€720K
Daniel Ríos|ST, LW, AM|14|31|Mexico|€200K
## atlanta-united
Lucas Hoyos|GK|1|37|Argentina|€110K
Jayden Hibbert|GK|42|22|Canada|€100K
Daniel Chica|RB, CB|44|24|United States|€230K
Matthew Edwards|RB, RM, LB|47|23|United States|€150K
Tomás Jacob|RB, CB, CM|55|22|Argentina|€4.2M
Enea Mihaj|CB|4|28|Albania|€2M
Júnior Alonso|CB, LB|6|33|Paraguay|€1M
Paulo Díaz|CB|27|32|Chile|€1.3M
Elías Báez|LB, LM|3|22|Argentina|€3.7M
Dominik Chong-Qui|LB, LWB, LM|50|18|United States|€630K
Giuliano Galoppo|DM, CM, AM|11|27|Argentina|€2M
Adrian Gill|DM, CM|16|20|United States|€360K
Steven Alzate|CM|7|28|Colombia|€1.5M
Tristan Muyumba|CM, DM, AM|8|29|France|€730K
Mauricio Amaro|CM, DM|14|21|Uruguay|€2.1M
Will Reilly|CM, DM|28|23|United States|€140K
Ajani Fortune|CM, AM, DM|35|23|Trinidad and Tobago|€620K
Cooper Sanchez|CM, AM|48|18|United States|€1.5M
Santiago Pita|AM|40|19|United States|
Enzo Dovlo|RW, RWB, RM|23||Togo|€300K
Patrick Weah|RW|||Liberia|€270K
Luke Brennan|RW, LW|20|21|United States|€280K
Aleksey Miranchuk|RW, ST|59|31|Russia|€5M
Miguel Almirón|LW, LM, RM, ST, RW|10|32|Paraguay|€4.1M
Cameron Dunbar|LW, AM, ST, LM|70|24|United States|€280K
Sérgio Santos|ST|19|32|Brazil|€150K
Fabrice Picault|ST, LW, AM||35|Haiti|€80K
Cayman Togashi|ST|30|33|Japan|€75K
Breel Embolo|ST|36|29|Switzerland|€16M
## houston-dynamo
Jimmy Maurer|GK|1|38|United States|€50K
Blake Gillingham|GK|26|24|United States|
Jonathan Bond|GK|31|33|England|€160K
Logan Erb|GK|35|22|United States|
Lawrence Ennali|RB, LB, LM, RM, RW|11|24|Germany|€1.2M
Felipe Andrade|RB, CB, LB|36|24|Brazil|€1.5M
Antônio Carlos|CB|3|33|Brazil|€92K
Lucas Halter|CB|5|26|Brazil|€1.1M
Agustin Resch|CB|34|24|Argentina|€450K
Reese Miller|LB, LM|||United States|
Marcelo Saracchi|LB|4|28|Uruguay|€990K
Franco Negri|LB, CB|21|31|Argentina|€69K
Artur|DM, CM|6|30|Brazil|€1.4M
Héctor Herrera|DM, CM, AM|16|36|Mexico|€120K
Matthew Arana|DM, CM, AM, RW, LW||16|Mexico|
Diadié Samassékou|CM, DM, AM|18|30|Mali|€450K
Duane Holmes|RM, RWB|14|32|United States|€110K
Ibrahim Aliyu|RM, RW|24|24|Nigeria|€620K
Agustín Bouzat|AM, CM, DM, ST|30|32|Argentina|€300K
Nick Markanich|RW, ST|17|26|Philippines|€98K
Mateusz Bogusz|RW, LM, LW, AM, ST|19|25|Poland|€5.9M
Nelson Quiñónes|LW|7|24|Colombia|€280K
Guilherme Augusto|LW, ST, AM|20|31|Brazil|€1.7M
Lyle Foster|ST, RW|9|26|South Africa|€6.9M
Duncan McGuire|ST|23|25|United States|€1.1M
## san-jose-earthquakes
Angus Gunn|GK|1|30|Scotland|€710K
Luca Ulrich|GK||23|United States|
Nate Crockford|GK|22|24|United States|€110K
Francesco Montali|GK|31|26|United States|
Earl Edwards Jr.|GK|36|34|United States|€50K
Jack Jasinski|RB, LB, RWB, CB|17|22|United States|€250K
Benji Kikanović|RB, RWB|28|26|United States|€560K
David Romney|CB, LB|4|33|United States|€110K
Daniel Munie|CB|5|26|United States|€1.6M
Reid Roberts|CB|18|22|United States|€1.1M
Max Floriani|CB|25|23|United States|€130K
Jamar Ricketts|LB, LW, LWB|2|25|United States|€610K
DeJuan Jones|LB|24|29|United States|€1.4M
Paul Marie|RWB, RW, LW|3|31|France|€69K
Vítor Costa|LWB, LB|87|32|Brazil|€66K
Ian Harkes|DM, CM|6|31|United States|€240K
Ronaldo Vieira|DM, CM|14|28|Guinea-Bissau|€290K
Beau Leroux|DM, CM, AM|34|23|United States|€2.3M
Jonathan González|DM, CM|40|27|Mexico|€110K
Edwyn Mendoza|CM||20|United States|
Rohan Rajagopal|CM, DM||19|United States|
Noel Buck|CM, RW|21|21|United States|€880K
Niko Tsakiris|AM|10|21|United States|€6.4M
Nick Fernandez|AM, CM|20|24|United States|€150K
Eduard Löwen|AM, CM, DM, RW|23|29|Germany|€1.7M
Ousseni Bouda|RW, ST, LW|7|26|Burkina Faso|€1.2M
Jack Skahan|RW, LW|16|28|United States|€140K
Timo Werner|LW, ST, AM|11|30|Germany|€2.3M
Darius Johnson|LW|79|26|Grenada|€120K
Kaedren Spivey|ST, CM, AM, LW||17|United States|
Luka Jovanović|ST|9|21|Australia|€1.4M
Preston Judd|ST|19|27|United States|€2M
Nonso Adimabua|ST|32|26|Nigeria|€110K
## st-louis-city
Roman Bürki|GK|1|35|Switzerland|€702.3K
Colin Welsh|GK|34|23|United States|
Benjamin Lundt|GK|39|30|Germany|€108.6K
Tyson Pearce|RB, RM, LM|33|19|United States|€857.1K
Mamadou Mbacke|CB|4|23|Senegal|€312.6K
Lukas MacNaughton|CB|5|31|Canada|€292K
Joshua Yaro|CB|15|31|Ghana|€101K
Dante Polvara|CB, DM, CM, AM|21|26|United States|€388.8K
Kyle Hiebert|CB|22|29|Canada|€487.7K
Fallou Fall|CB|27|22|Senegal|€2.1M
Timo Baumgartl|CB|32|30|Germany|€216.6K
Jaziel Orozco|CB, LB|99|22|United States|€600.8K
Tahir Reid-Brown|LB, CB|3|20|United States|€695.8K
Conrad Wallem|RWB, RM, RB, LB|6|26|Norway|€1.7M
Tomas Totland|LWB, LM, RM, RB|14|26|Norway|€521.4K
Rafael Santos|LWB, LM, LB|20|28|Brazil|€237.6K
Christopher Durkin|DM, CM|8|26|United States|€1.3M
Daniel Edelman|DM, CM|24|23|United States|€1.9M
Miguel Perez|DM, CM, RW|28|21|United States|€558.2K
Charles-Emile Brunet|CM||22|Canada|€217K
Carlo Holse|AM, LW, RW|19|27|Denmark|€3.7M
Alexandru Mățan|AM, LW, ST, CM|23|27|Romania|€1.1M
Caden Glover|AM|46|19|United States|€1.1M
Sang-Bin Jeong|AM, RW, ST, LW|77|24|South Korea|€1M
Mykhi Joyner|RW, LW|59|20|United States|€1M
Brendan McSorley|RW, ST|80|24|United States|€301.3K
Tomás Ostrák|LW|7|26|Czech Republic|€328.4K
Célio Pompeu|LW|12|26|Brazil|€354.9K
Zach Zengue|LW, LM, ST, AM|91|22|United States|
Rafael Navarro|ST|9|26|Brazil|€2.7M
Simon Becher|ST, RW|11|27|United States|€613.4K
Palmer Ault|ST|29|22|United States|€108K
Damion Downs|ST|42|22|United States|€6.8M
## colorado-rapids
Zack Steffen|GK|1|31|United States|€658.4K
Nicholas Hansen|GK|41|25|United States|€236.9K
Zack Campagnolo|GK|51|18|United States|
Keegan Rosenberry|RB|2|32|United States|€305.2K
Reggie Cannon|RB|4|28|United States|€922.1K
Kosi Thompson|RB, CB, LB|33|23|Canada|€526.5K
Loïc Williams|CB|5|24|Spain|€1.2M
Rob Holding|CB|6|30|England|€1.4M
Noah Cobb|CB|24|21|United States|€1.2M
Miguel Navarro|LB, LWB|29|27|Venezuela|€1.2M
Jackson Travis|LB, LWB, LW, RB|99|22|United States|€428K
Hamzat Ojediran|DM, CM|8|22|Nigeria|€2.2M
Joshua Atencio|DM, CM|12|24|United States|€1.5M
Wayne Frederick|DM, CM, AM, RB|13|22|Trinidad and Tobago|€306.6K
Ali Fadal|CM, DM|15|22|Ghana|€203.3K
Alex Harris|RM, ST, RW|16|21|United States|€551.9K
Paxten Aaronson|AM, CM, RW|10|23|United States|€6.5M
Youssef Maziz|AM, LW, CM|88|28|France|€564K
Theodore Ku-DiPietro|LW|21|24|United States|€914.6K
Kimani Stewart|LW, RM, LM|27|21|Canada|€268.9K
Darren Yapi|LW, RW, ST|77|21|United States|€1.8M
Georgi Minoungou|LW|93|24|Burkina Faso|€1.4M
Sydney Wathuta|ST, CM, AM, LM, RW|47|22|Canada|
Rafael Navarro|ST|9|26|Brazil|€3.4M
Mamadou Billo Diop|ST|26|19|Senegal|€1M
Donavan Phillip|ST|32|21|Saint Lucia|
## seattle-sounders
Stefan Frei|GK|24|40|Switzerland|€50K
Andrew Thomas|GK|26|28|United States|€600K
Max Anchor|GK|50|22|Canada|€330K
Kalani Rienzi|RB|85|24|United States|€920K
Ryan Sailor|CB|4|27|United States|€67K
Álex Roldán|CB, RB, DM|16|30|El Salvador|€1.9M
Kee-Hee Kim|CB|20|37|South Korea|€50K
Jackson Ragen|CB|25|28|United States|€1.8M
Yeimar Gómez|CB|28|34|Colombia|€450K
Antino Lopez|CB|35|24|United States|€230K
Stuart Russell Hawkins|CB|39|20|United States|€490K
Gallatin Sandnes|CB|53|18|United States|
Nouhou Tolo|LB, CB|5|29|Cameroon|€2M
Cristian Roldan|DM|7|31|United States|€1.9M
Hassani Dotson|DM|31|29|United States|€1.8M
Xavi Gnaulati|DM, CM, AM|32|21|United States|€280K
Snyder Brunell|DM, RW|37|19|United States|
Mark O'Neill|DM, CB, RB, CM|40|24|United States|
Nikola Petković|DM|44|23|Serbia|€630K
Peter Kingston|DM, CM, RB|45|25|United States|€290K
Edson Carli|AM, RW, ST||19|United States|€610K
Rafael Jauregui|AM, LW, RW||21|United States|€280K
Albert Rusnák|AM, CM|11|32|Slovakia|€1.4M
Caden Clark|AM|8|23|United States|€450K
Jordan Morris|RW, LW, ST|13|32|United States|€1.9M
Jesús Ferreira|RW, AM, LW|27|25|United States|€2.6M
Pedro De la Vega|LW|10|25|Argentina|€1.2M
Paul Rothrock|LW, RW|14|27|United States|€1.7M
Paul Arriola|LW, RW|17|31|United States|€1.2M
Sebastian Gomez|LW, RW|90|20|United States|€540K
Dejan Joveljić|ST|9|27|Serbia|€6.7M
Danny Musovski|ST|19|30|North Macedonia|€1.6M
## sporting-kc
John Pulskamp|GK|1|25|United States|€210K
Jack Kortkamp|GK|12|18|United States|
Stefan Cleveland|GK|30|32|United States|€190K
Jacob Davis|RB|8|24|United States|€1.2M
Justin Reynolds|RB|13|22|United States|€340K
Ian James|CB, RB|2|18|United States|€1.2M
Moisés Mosquera|CB|3|25|Colombia|€2M
Or Blorian|CB|5|26|Israel|€1.4M
Jansen Miller|CB|15|24|United States|€330K
Wyatt Meyer|CB|28|25|United States|€230K
Diego Borges|CB|57|21|Brazil|
Emir Karić|LB, LM|18|29|Bosnia-Herzegovina|€750K
Jayden Reid|LB|99|25|United States|€210K
Lasse Berg Johnsen|CM, DM|4|27|Norway|€1.8M
Jacob Bartlett|CM, DM|16|21|United States|€1.4M
Kwaku Agyabeng|CM|20|20|Ghana|€380K
Zorhan Bassong|CM, DM|22|27|Canada|€740K
Owen Wolff|CM|33|21|United States|€4.2M
André Luiz|RM, RW|11|24|Brazil|€17M
Magomed-Shapi Suleymanov|RM, LW, LM, AM, ST|93|26|Russia|€1.3M
Calvin Harris|LM, LW, RW|14|26|England|€330K
Rubén Ramos|AM, LW|24|19|United States|€630K
Capita|LW, RM, LM, RW|7|24|Angola|€1.5M
Stephen Afrifa|ST|17|25|Canada|€250K
Taylor Calheira|ST|19|24|United States|
Seymour Reid|ST|29|18|Jamaica|€1.2M
## real-salt-lake
Rafael Cabral|GK|1|36|Brazil|€220K
Max Kerkvliet|GK|24|21|United States|
DeAndre Yedlin|CB, RM|2|33|United States|€290K
Kobi Henry|CB|3|22|Trinidad and Tobago|€420K
Lukas Engel|CB|4|27|Denmark|€1.7M
Justen Glad|CB|15|29|United States|€1.4M
Juan José Arias|CB|21|22|Colombia|€1.4M
Philip Quinton|CB|26|26|United States|€270K
Sam Junqua|CB, LM|29|29|United States|€480K
Luis Rivera|CB, LB|37|18|United States|€590K
Luc De Fougerolles|CB|44|21|Canada|€6.3M
Gio Villa|RWB, LWB|41|18|United States|
Zach Booth|RWB, RM, LW|23|22|United States|€160K
Juan Sanabria|LWB, LM, LB|8|26|Uruguay|€2.5M
Colin Guske|DM, CB|25|19|United States|€750K
Griffin Dillon|DM, CM|27|23|United States|€200K
Liam O'Gara|CM, CB||22|United States|
Stijn Spierings|CM, DM|6|30|Netherlands|€1M
Luca Moisa|CM, DM, AM|34|18|United States|€830K
Omar Marquez|CM, DM|40|18|United States|
Noel Çalışkan|CM, DM|92|26|Germany|€1.1M
Dominik Marczuk|RM, RWB|11|23|Poland|€1.1M
Dušan Žagar|RM, LW, LM, RW|28|20|Serbia|€1.8M
Alexandros Katranis|LM, LWB|98|28|Greece|€460K
Emeka Eneli|LM|14|27|United States|€1.3M
Morgan Guilavogui|AM, LW, LM, RW|9|28|Guinea|€2.3M
Diego Luna|AM, LM, RW, LW|10|23|United States|€6.4M
Antonio Riquelme|AM, RW, CM, LW, RM, ST|38|18|United States|
Saba Lobjanidze|RW, ST, RM, LW, AM|12|31|Georgia|€1M
Aiden Hezarkhani|RW, AM|39|19|United States|€4.9M
Owen Anderson|LW, LM, AM|30|19|United States|
Taylor Booth|LW|18|25|United States|€850K
Chance Cowell|ST||18|United States|€700K
Jason Shokalook|ST|13|24|United States|€230K
Ariath Piol|ST|19|22|Australia|€480K
Sergi Solans|ST|22|23|Spain|€6.2M
Lineker Rodrigues dos Santos|ST, AM, RM|70|24|Brazil|€160K
## san-diego-fc
Carlos Dos Santos|GK|1|26|Cape Verde|€780K
Pablo Sisniega|GK|13|31|Mexico|€150K
Marcus Alstrup|GK|16|22|Denmark|€140K
Duran Ferree|GK|18|20|United States|€1.6M
William Kumado|RB|2|24|Ghana|€670K
Dagur Thórhallsson|RB, LW, RW, RM|3|26|Iceland|€1M
Ian Pilcher|RB, CB, LB|25|23|United States|€210K
Oscar Verhoeven|RB|33|20|United States|€1.3M
Osvald Gabriel Søe|CB|17|20|Denmark|
Manu Duah|CB|26|21|Ghana|€4.4M
Ian Murphy|CB|32|26|United States|€500K
Christopher McVey|CB|97|29|Sweden|€1.3M
Kieran Sargeant|LB, LM|5|23|United States|€690K
Samuel Vines|LB|23|27|United States|€450K
Jeppe Tverskov|CM|6|33|Denmark|€360K
Onni Valakari|CM, ST|8|27|Finland|€4.3M
Gabriel Pirani|CM, ST|12|24|Brazil|€870K
Pedro Soma|CM|15|20|United States|€1.1M
David Vazquez|CM, LW, RW|19|20|United States|€1.5M
Aníbal Godoy|CM, DM|20|36|Panama|€110K
David Mimbang|Midfielder|36|18|Cameroon|
Alejandro Alvarado|CM|70|23|United States|€150K
Elias Achouri|LM, LW, RW|99|27|Tunisia|€1.9M
Anders Dreyer|RW|10|28|Denmark|€16M
Bryan Zamblé|LW|14|18|Ivory Coast|€970K
Emmanuel Boateng|LW|24|32|Ghana|€53K
Alex Mighten|LW|77|24|England|€320K
Amahl Pellegrino|LW|90|36|Norway|€81K
Marcus Ingvartsen|ST|7|30|Denmark|€2.2M
Cédric Bakambu|ST|94|35|DR Congo|€730K
## austin-fc
Brad Stuver|GK|1|35|United States|€160k
Damian Las|GK|12|24|United States|€260k
Charlie Farrar|GK|39|23|England|
Riley Thomas|RB|2|24|United States|
Evan Watt|CB|||United States|
Mikkel Desler|CB, RB, RM|3|31|Denmark|€710k
Brendan Hines-Ike|CB|4|31|United States|€460k
Oleksandr Svatok|CB|5|32|Ukraine|€710k
Jon Bell|CB, LB|15|29|Jamaica|€160k
Christopher Applewhite|CB|22|19|United States|€860k
Guilherme Biro|CB, LB|29|26|Brazil|€1.3m
Mateja Djordjević|CB|35|23|Serbia|€890k
Žan Kolmanič|LB, CB|23|26|Slovenia|€290k
Eze Onuoha|CM, RM, LM|||Finland|€760k
Ilie Sánchez|CM, DM, CB|6|36|Spain|€50k
Besard Šabović|CM, DM|14|28|Sweden|€950k
Jorge Alastuey|CM, AM, RW, ST, LW|24|23|Spain|
Ervin Torres|CM, DM, RW|38|19|United States|€1.1m
Joseph Rosales|RM, LB, LM, RW, RWB, CM, DM|30|26|Honduras|€1.7m
Jon Gallagher|LM, RB, LW, LWB|17|30|Ireland|€1m
Facundo Torres|RW, AM, RM, LW, ST|11|26|Uruguay|€11m
Micah Burton|RW, LW|32|20|United States|€440k
Przemysław Płacheta|RW, AM, RM|77|28|Poland|€750k
Brandon Vázquez|ST|9|28|United States|€4.3m
Myrto Uzuni|ST, LW, RW, AM|10|31|Albania|€2.1m
Christian Ramirez|ST, RW|21|35|United States|€200k
## fc-dallas
Eryk Dymora|GK|98|24|United States|
Michael Collodi|GK|30|25|United States|€150K
Jonathan Sirois|GK|40|25|Canada|€330K
Daniel|GK|42|32|Brazil|€230K
Geovane Jesus|RB|2|25|Brazil|€420K
Enzo Newman|RB|29|20|United States|
Osaze Urhoghide|CB|3|26|England|€1.4M
Lalas Abubakar|CB|5|31|Ghana|€50K
Shaq Moore|CB, RB, LWB|18|30|United States|€980K
Álvaro Augusto|CB|22|21|Brazil|
Sebastien Ibeagha|CB|25|34|Nigeria|€70K
Slade Starnes|CB|26|23|United States|
Nolan Norris|CB, LB||21|United States|€820K
Kaka Scabin|Defender|34|19|United States|
Joshua Torquato|LB|24|19|United States|€720K
Sam Sarver|RWB|28|23|United States|€390K
Clay Holstad|DM|33|26|United States|€96K
Ran Binyamin|CM, LWB, RWB, LW, LM|6|22|Israel|€1.1M
Christian Cappis|CM, DM, LM|12|27|United States|€320K
Ramiro|CM, DM|17|33|Brazil|€110K
Caleb Swann|CM, AM, DM|27|19|United States|€570K
Kaick Ferreira|CM, DM, AM|55|20|Brazil|€5.2M
Herman Johansson|RM, RWB, RB|14|29|Sweden|€1M
Bernard Kamungo|LM, LWB, LB|77|24|Tanzania|€950K
Patrickson Delgado|AM, CM, RW|8|23|Ecuador|€2.2M
Santiago Moreno|AM, LW, ST, LM|10|26|Colombia|€2M
Joaquín Valiente|AM, RW, RM, CM|21|25|Uruguay|€1.7M
Ricky Louis|RW, ST, RM, LM|15|22|Haiti|€270K
Daniel Job|LW, AM|7|21|Nigeria|€4.7M
Benjamin Flowers|LW|31|15|United States|
Daniel Baran|LW, LM|36|20|United States|
Diego García|LW, CM, ST|50|20|United States|
Anderson Julio|ST|11|30|Ecuador|€1.3M
Petar Musa|ST|9|28|Croatia|€11M
Nicholas Simmonds|ST, RW|16|19|Jamaica|€560K
Logan Farrington|ST|23|24|United States|€2.6M
## minnesota-united
Alec Smir|GK|1|27|United States|€50K
Drake Callender|GK|12|29|United States|€476.7K
Kayne Rizvanovich|GK|94|18|United States|€782.1K
D.J. Taylor|RB, CB|27|29|United States|
Cherrion Valerius|RB, CB, RWB|52|21|Netherlands|€890.1K
Nicolás Romero|CB|5|22|Argentina|€2.1M
Michael Boxall|CB|15|38|New Zealand|€105.7K
Morris Duggan|CB|23|25|Germany|€993.3K
Jefferson Díaz|CB, RB|28|25|Colombia|€901K
Carlos Harvey|CB, CM, DM|67|26|Panama|€349.6K
Kieran Chandler|LB, LM, LW|33|21|United States|€396.4K
Kyle Duncan|RWB, RM|3|29|Jamaica|€467.5K
Bongokuhle Hlongwane|RWB, RM, RW, ST|21|26|South Africa|€1.4M
Anthony Markanich|LWB, LB, LM|13|26|Philippines|€2M
Peter Stroud|DM|6|24|United States|€334.2K
Wil Trapp|CM, DM|20|33|United States|€138.6K
Julian Gressel|CM||32|United States|€491.9K
Nectarios Triantis|CM, DM|25|23|Greece|€4.1M
Owen Gene|CM, DM|30|23|France|€1.4M
Joaquín Pereyra|AM, RW, LM, RM, ST|26|27|Argentina|€4.1M
Tomás Chancalay|LW, AM, LM|8|27|Argentina|€1.5M
Aziel Jackson|LW|16|24|United States|€1.2M
Mauricio González|LW|18|22|Colombia|€1M
Troy Putt|LW, ST, RWB|32|20|New Zealand|€476.9K
Darius Randell|LW, RW, LM, ST||19|United States|€740.4K
Kelvin Yeboah|ST|9|26|Italy|€6.5M
Maurice Malone|ST, AM, RW|11|26|Germany|€843.9K
Marcus Caldeira|ST|22|22|Canada|€359.7K
Mamadou Dieng|ST|29|22|Senegal|€175.3K
Jordan Adebayo-Smith|ST, RW|99|25|Nigeria|€135.9K
`;
