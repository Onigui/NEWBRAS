/**
 * Elencos reais da Liga Portugal 2026/27 copiados do FotMob em 24/11/2026, um bloco por clube ("## slug").
 * Formato de cada linha: nome|posições|número|idade|país (em inglês)|valor de mercado.
 * A conversão para jogadores do jogo fica em ./fotmob.ts.
 */
export const ELENCOS_POR = `
# FotMob, elencos da Liga Portugal 2026/27 (consulta em 24/11/2026). Nome|posições|número|idade|país|valor
## porto
Cláudio Ramos|GK|14|35|Portugal|€270K
João Costa|GK|24|30|Portugal|€580K
João Afonso|GK|50|19|Portugal|€1.7M
Diogo Costa|GK|99|27|Portugal|€40M
Alberto Costa|RB|20|23|Portugal|€21M
Martim Fernandes|RB, LB|52|20|Portugal|€16M
Jakub Kiwior|CB, LB|4|26|Poland|€40M
Jan Bednarek|CB|5|30|Poland|€8.6M
Chris Smalling|CB|6|37|England|€570K
Nehuén Pérez|CB|18|26|Argentina|€12M
Dominik Prpić|CB|21|22|Croatia|€4.1M
Zaidu Sanusi|LB|12|29|Nigeria|€1.6M
Souza|LB, LWB|33|20|Brazil|
Francisco Moura|LB|74|27|Portugal|€6.4M
In-Beom Hwang|DM, CM, AM|16|30|South Korea|€4.9M
Victor Froholdt|CM, AM|8|20|Denmark|€71M
Gabriel Veiga|CM, AM|10|24|Spain|€40M
Pablo Rosario|CM, CB, DM|13|29|Dominican Rep.|€10M
Vasco Sousa|CM|15|23|Portugal|€1.8M
Alan Varela|CM, DM|22|25|Argentina|€32M
Seko Fofana|CM|42|31|Ivory Coast|€5.1M
Gabriel Mec|AM, LW, CM, RW|37|18|Brazil|
Cardoso Varela|RW||18|Portugal|
William Gomes|RW|7|20|Brazil|€36M
Pepê|RW, LW|11|29|Brazil|€13M
Duarte Cunha|RW, CM|57|18|Portugal|€1.7M
Borja Sainz|LW|17|25|Spain|€23M
Oskar Pietuszewski|LW|77|18|Poland|€27M
Samuel Aghehowa|ST|9|22|Spain|€45M
André Silva|ST|19|31|Portugal|€2.3M
Santiago Giménez|ST|29|25|Mexico|€19M
## benfica
Anatoliy Trubin|GK|1|25|Ukraine|€19M
Samuel Soares|GK|24|24|Portugal|€11M
Alexander Bah|RB|6|28|Denmark|€11M
Clément Lenglet|CB|2|31|France|€2.4M
Alessandro Circati|CB|3|23|Australia|€22M
Gabriel Índio|CB|33|18|Brazil|
Tomás Araújo|CB, RB|44|24|Portugal|€41M
Samuel Dahl|LB|26|23|Sweden|€17M
Souffian El Karouani|LB|34|26|Morocco|€17M
Enzo Barrenechea|DM|5|25|Argentina|€15M
Fredrik Aursnes|DM, RW, CM, RB|8|30|Norway|€15M
Manu Silva|DM|16|25|Portugal|€5.6M
Leandro Barreiro|DM, AM|18|26|Luxembourg|€22M
João Palhinha|DM, CM, CB|36|31|Portugal|€15M
Miguel Figueiredo|CM|73|18|Portugal|€1.6M
Daniel Banjaqui|RM, RB|58|18|Portugal|
José Neto|LM, LB|62|18|Portugal|€2.5M
Georgiy Sudakov|AM, LW, CM, DM, LM|10|24|Ukraine|€26M
Jakub Kamiński|AM, LM, LW, CM, DM, RWB|13|24|Poland|€18M
Dodi Lukébakio|RW|11|29|Belgium|€16M
Gianluca Prestianni|RW, LW, AM, LM|25|20|Argentina|€47M
Rafa Silva|RW, AM, LW|27|33|Portugal|€2M
Gonçalo Moreira|RW, CM|77|20|Portugal|€1.8M
Andreas Schjelderup|LW, RW|21|22|Norway|€41M
Anisse Saidi|ST||18|Tunisia|€490K
Vangelis Pavlidis|ST|14|28|Greece|€39M
Jhon Durán|ST|22|22|Colombia|€18M
Claudio Echeverri|ST, AM|30|20|Argentina|€17M
Anísio Cabral|ST|72|18|Portugal|
## sporting
Rui Silva|GK|1|32|Portugal|€2.7M
Kaique Pereira|GK|30|23|Brazil|€4.7M
Diego Callai|GK|41|22|Brazil|€1.5M
Georgios Vagiannidis|RB|13|25|Greece|€6.1M
Iván Fresneda|RB, LB|22|22|Spain|€21M
Rodrigo Dias|RB, LB, RM|50|21|Portugal|€1.3M
Salvador Blopa|RB|70|19|Portugal|€2M
Zeno Debast|CB|6|23|Belgium|€26M
Gonçalo Inácio|CB|25|25|Portugal|€40M
Ibrahima Ba|CB|55|21|Senegal|€15M
Eduardo Quaresma|CB, RB|72|24|Portugal|€17M
Eduardo Felicíssimo|CB, DM, CM|73|19|Portugal|€2M
Moncef Zekri|LB|18|18|Morocco|€6M
Maxi Araújo|LB, LW, LM, LWB|20|26|Uruguay|€39M
Nuno Santos|LB|11|31|Portugal|€1.1M
Sotiris Alexandropoulos|DM||24|Greece|€780K
Silas Andersen|DM, CM|4|22|Denmark|€9.1M
Sergi Altimira|DM, CM|5|25|Spain|€25M
João Simões|DM, CM|8|19|Portugal|€19M
Pedro Lima|CM, AM|21|23|Brazil|€2.2M
Issa Doumbia|CM, DM, AM|77|23|Italy|€24M
Nestory Irankunda|RM, LW, LM, ST, AM|19|20|Australia|€19M
Geny Catamo|RW, RWB|10|25|Mozambique|€38M
Rodrigo Zalazar|RW, AM, CM, ST|17|27|Uruguay|€33M
Delcio Aurelio|Attacker||19|Angola|
Jesse Derry|LW|28|19|England|€2.1M
Luís Guilherme|LW, RW|31|20|Brazil|€16M
Flávio Gonçalves|LW, LM, RW|58|19|Portugal|€19M
Rodrigo Rodrigues|Attacker|76|18|Portugal|€950K
Fotis Ioannidis|ST, AM|7|26|Greece|€17M
Rafael Nel|ST|9|21|Portugal|€3.5M
Luis Suárez|ST|97|28|Colombia|€33M
## santa-clara
Lucas França|GK|1|30|Brazil|€660K
Neneca|GK|12|23|Brazil|€300K
Tomé Sousa|GK|76|19|Portugal|€410K
Lucas Soares|RB, RM, RWB|42|28|Brazil|€1.2M
Henzo dos Santos|Defender||19|Brazil|
Henrique Silva|CB|3|21|Brazil|€650K
Pedro Pacheco|CB|4|29|Portugal|€500K
Ythallo|CB|19|22|Brazil|€510K
Emanuel Moreira|CB|21|23|Portugal|€940K
Kamika|CB|85|22|Portugal|
Guilherme Romão|LB|5|29|Brazil|€590K
MT|LB|32|25|Brazil|€2.2M
Tiago Duarte|LB|80|22|Portugal|
Daniel Borges|DM, CM, AM|41|23|Brazil|€760K
Pedro Jesus|Midfielder||23|Portugal|
Pedro Ferreira|CM, DM|6|28|Portugal|€1.9M
Djé Tavares|CM, DM, AM|8|23|Cape Verde|€1.3M
Tiago Ribeiro|CM, DM, AM|20|24|Portugal|€600K
Frederico Silva|Midfielder|25|20|Portugal|
Seydou Fofana|CM|81|19|Burkina Faso|
Vasconcelos|AM|17|21|Portugal|€1.3M
Vinícius|RW, LW, ST|70|27|Brazil|€1.7M
Sorriso|RW|99|20|Brazil|
Brenner|LW, RW, ST|10|24|Brazil|€1.3M
Welinton|LW, LM, RW|11|27|Brazil|€460K
Afonso Duarte|LW|18|21|Portugal|€460K
Vitinho|LW|22|22|Brazil|€670K
Vital Maia|Attacker|51|19|Portugal|
Luis Fernando|ST|7|21|Brazil|
Gonçalo Paciência|ST|9|32|Portugal|€590K
Léo Jacó|ST|73|21|Brazil|
## arouca
Jakub Vinarčík|GK|1|21|Slovakia|€520K
Ignacio de Arruabarrena|GK|12|29|Uruguay|€900K
Martim Duarte|GK|71|23|Portugal|
Leo Shahar|RB|2|19|England|
Diogo Monteiro|RB|4|21|Portugal|€580K
Tiago Esgaio|RB|28|31|Portugal|€590K
José Fontán|CB, LB|3|26|Spain|€1.4M
Boris Popović|CB|5|26|Serbia|€910K
Javi Sánchez|CB|15|29|Spain|€570K
Orest Lebedenko|LB|18|28|Ukraine|€520K
Mario Climent|LB|37|24|Spain|€600K
Espen van Ee|DM|6|23|Netherlands|€1.6M
Taichi Fukui|DM, AM|8|22|Japan|€7.9M
Pedro Santos|DM|89|26|Portugal|€620K
Rachid Gomes|Midfielder|27|18|Cape Verde|
Si-Hoo Park|LM|77|19|South Korea|
Pablo Gozálbez|AM, RW|10|25|Spain|€670K
Hyun-Ju Lee|AM|14|23|South Korea|€2.1M
Mateo Flores|AM|21|22|Spain|€1.1M
Brian Mansilla|AM|24|24|Uruguay|€860K
Miguel Puche|RW|11|25|Spain|€500K
Alfonso Trezza|RW|19|27|Uruguay|€920K
Naïs Djouahra|LW|7|27|France|€1.2M
Gabriel Rukavina|LW, RW|20|22|Croatia|€660K
Francisco Costa|Attacker|97|18|Portugal|
Fally Mayulu|ST|9|24|France|€1.1M
Barbero|ST|17|28|Spain|€1.8M
Dylan Nandín|ST|23|24|Uruguay|€1.1M
## academico-viseu
Marcos Lavín|GK|1|30|Spain|€230K
Juan Soriano|GK|12|29|Spain|€530K
Matheus Sampaio|GK|58|22|Brazil|€350K
Ewerton|GK|98|28|Brazil|
Tomás Domingos|RB|21|27|Portugal|€260K
Robinho|RB|75|29|Portugal|€290K
Nikolaos Michelis|CB|2|25|Greece|€930K
Pedro Barcelos|CB|5|30|Brazil|€250K
Anthony Correia|CB|41|27|France|€870K
Rúben Pereira|CB|44|28|Portugal|€270K
Hugo Gambor|CB|82|23|Central African Rep.|€900K
Miguel Ángel Brau|LB|3|24|Spain|€1M
Gu Costa|LB|57|21|Portugal|€1.9M
Igor Milioransa|LB|66|30|Brazil|€260K
Tomas Silva|DM||23|Portugal|€230K
André Ceitil|DM|6|31|Portugal|€250K
Luís Silva|DM, CM|7|34|Portugal|€320K
Soufiane Messeguem|DM, AM, CM|14|25|Germany|€1.2M
Cristian Ferreira|DM|18|27|Argentina|€260K
Andro Babić|CM|29|22|Croatia|€880K
Alejandro Mestanza|RM|45|21|Spain|€640K
Cihan Kahraman|AM, CM, DM|8|28|Türkiye|€610K
Nils Mortimer Moreno|RW|22|25|Spain|€530K
João Guilherme|RW, LW|31|26|Brazil|€670K
Lorougnon Gohi|RW, LW|47|22|Ivory Coast|€590K
Álvaro Zamora|LW, RW|10|24|Costa Rica|€1.4M
Valery Fernández|LW, LM|17|27|Spain|€380K
Issoufi Maiga|Attacker|23|24|Mali|€390K
Mohamed Bouldini|ST|9|30|Morocco|€270K
André Clóvis|ST|33|29|Brazil|€2.3M
Paulinho|ST|77|27|Portugal|€500K
## gil-vicente
André Picornell|GK|1|22|Sweden|€520K
Lucão|GK|30|25|Brazil|€1.2M
Tiago Ferreira|GK|44|17|Portugal|
Samuel Portugal|GK|94|32|Brazil|€480K
José Silva|RB|2|21|Portugal|€1M
Ricardo Esgaio|RB, LB|47|33|Portugal|€570K
Antonio Espigares|CB|3|22|Spain|€880K
Marvin Gilbert|CB|4|23|France|€4.3M
Jonathan Buatu|CB|39|33|Angola|€520K
Arthur Tchaptchet|CB|59|20|France|
Weverson|LB|26|26|Brazil|€740K
David Moreira|LB, CB|45|22|Cape Verde|€1.5M
Zé Carlos|DM|6|25|Portugal|€840K
Mohamed Bamba|DM|8|22|Ivory Coast|€1.3M
Andreas Lausen|DM, CM|12|24|Denmark|€670K
Gonçalo Maia|Midfielder|82|20|Portugal|€380K
Diogo Prioste|CM, DM|86|22|Portugal|€1.8M
Santi García|AM, DM|10|25|Spain|€2.6M
Guilherme Gomes|AM|19|20|Brazil|
Sergio Bermejo|RW|17|29|Spain|€270K
Murilo|RW, RM|77|32|Brazil|€690K
Tidjany Touré|LW|7|24|France|€650K
Joelson Fernandes|LW, RW|11|23|Portugal|€1.2M
Gil Martins|LW|20|20|Portugal|
Agustín Moreira|LW|27|25|Uruguay|€810K
Martín Fernández|LW|32|23|Uruguay|€580K
Walace França|ST|9|21|Brazil|€580K
Héctor Hernández|ST|23|31|Spain|€420K
Mohamed Kaba|ST|99|24|Mali|
## braga
Tiago Sá|GK|12|31|Portugal|€200K
Bernardo Fontes|GK|31|24|Brazil|
Sikou Niakaté|CB|4|27|Mali|€4M
Carvalho|CB|6|29|Brazil|€2.2M
Gustaf Lagerbielke|CB|14|26|Sweden|€11M
Sergio Barcia|CB|22|25|Spain|€1.3M
Bright Arrey-Mbi|CB, LB|26|23|Germany|€12M
Adrian Barišić|CB|37|25|Bosnia-Herzegovina|€2.6M
Adrian Bajrami|CB, LB|44|24|Switzerland|€2.2M
Demir Tıknaz|DM, CM, AM|34|22|Türkiye|€12M
João Moutinho|CM, DM|8|40|Portugal|€300K
Tomás Marqués|CM|16|20|Spain|€16M
Denis Huseinbašić|CM|23|25|Bosnia-Herzegovina|€1.7M
Jean-Baptiste Gorby|CM, DM|29|24|France|€11M
Víctor Gómez|RM, RB, RWB, CB|2|26|Spain|€11M
Gabri Martínez|LM, LWB, LW|77|23|Spain|€9.1M
João Aragão|AM|72|18|Portugal|
Mario Dorgeles|RW, RM, LM|20|22|Ivory Coast|€12M
Diogo Travassos|RW, LB, RB, RM, LM, RWB|7|22|Portugal|€7.3M
Diego Rodrigues|LW, LM, CM|50|21|Portugal|
Gabriel Silva|LW, RW, ST, LM, RM, LWB|11|24|Brazil|€7.1M
Ricardo Horta|LW, AM, ST, RW|21|32|Portugal|€6.1M
Flinto Costa|Attacker|98|19|Guinea-Bissau|
Fran Navarro|ST|9|28|Spain|€2.4M
Pau Víctor|ST, RW, LW, AM|10|24|Spain|€17M
Jovan Milošević|ST|17|21|Serbia|€11M
Jonas Wind|ST|19|27|Denmark|€2.5M
## moreirense
Aranha|GK|1|21|Brazil|
Francisco Barbosa|GK|12|19|Portugal|
André Ferreira|GK|13|30|Portugal|€490K
Leandro Santos|RB|2|21|Portugal|€1.6M
Dinis Pinto|RB|76|26|Portugal|€2M
Henrique Sa|Defender||21|Portugal|
Kevyn Monteiro|CB|4|21|Brazil|
Maracás|CB|26|32|Brazil|€530K
Pedro Jesus|Defender|31|18|Brazil|
Janderson|Defender|32|21|Brazil|
Gilberto Batista|CB|66|22|Guinea-Bissau|€1.9M
Álvaro Martínez|LB|17|24|Spain|€530K
Kiko|LB|27|24|Portugal|
Nile John|DM, CM, AM|23|23|England|€730K
Afonso Assis|DM, CM|25|20|Portugal|€990K
Jimi Gower|DM|30|22|England|€530K
Mateja Stjepanović|CM, DM|8|22|Serbia|€3.9M
João Veloso|CM|20|21|Portugal|€1.6M
Rodri|CM, DM, AM, ST|21|23|Spain|€1.8M
Guilherme Liberato|CM, DM|65|25|Brazil|€780K
Miguel Silva|Midfielder|87|18|Portugal|€520K
Manuel Mendonça|AM, RW, ST, LW|7|21|Portugal|
Michael Dacosta|RW|44|21|Spain|
Afonso Vieira|RW|89|19|Portugal|
Koby Mottoh|LW|77|20|Ghana|
Kiko Bondoso|LW, RW, RM|10|31|Portugal|€380K
Landerson|LW, RW|11|19|Brazil|€1.6M
Tiago Andrade|LW, RW|19|21|Portugal|€1.8M
Songa Chipyoka|LW|28|22|Zambia|€560K
Dante Brito|Attacker|35|18|Brazil|
Rodrigo Soares|Attacker|90|19|Portugal|
Alexandre Duville-Parsemain|ST|9|23|Martinique|€770K
Leonardo Vonić|ST|79|23|Croatia|€1M
Maranhão|ST|99|24|Brazil|€640K
## famalicao
Ivan Zlobin|GK|1|29|Russia|€560K
Gabriel Cabral|GK|22|23|Brazil|
Lazar Carević|GK|25|27|Montenegro|€3.9M
Gustavo Garcia|RB, LB|2|24|Brazil|€1.3M
Rodrigo Pinheiro|RB|17|24|Portugal|€5.2M
Matheus Colombo|CB||20|Brazil|
Léo Realpe|CB|3|25|Ecuador|€4.8M
Finn van Breemen|CB|4|23|Netherlands|€1.8M
Víctor Rofino|CB|15|24|Guinea-Bissau|€1.3M
Vojin Serafimović|CB|30|21|Serbia|€740K
Juvenal Correia|Defender|72|19|Guinea-Bissau|
Leny Meyer|LB|5|22|Switzerland|€700K
Pedro Bondo|LB|28|22|Angola|€1.9M
Tommie van de Looi|DM, CM|6|27|Netherlands|€1.9M
Marcos Peña|DM|8|21|Spain|€1.5M
Mathias De Amorim|DM, CM, AM|14|21|Portugal|€14M
Paulo Moreira|DM, CM, AM|19|26|Portugal|€1.2M
Tamás Szucs|DM, AM, CM|21|21|Hungary|€2.1M
Mathis Jangéal|CM|24|18|France|€1.5M
Pedro Santos|AM, CM|10|23|Portugal|€680K
Roméo Beney|RW|18|21|Switzerland|€1.6M
Gil Dias|RW|23|30|Portugal|€1.2M
Sorriso|LW, RW|7|25|Brazil|€6.2M
Óscar Aranda|LW|11|24|Spain|€2.2M
Umar Abubakar|ST|9|20|Nigeria|€1.3M
Patricio Salas|ST|33|22|Mexico|€4.7M
Georgios Koutsias|ST, LW|70|22|Greece|€3.9M
## alverca
Noah Raveyre|GK||21|France|€1.8M
André Paulo|GK|23|29|Portugal|€330K
Matheus Mendes|GK|31|27|Brazil|€520K
Jhonatan|GK|91|35|Brazil|€390K
Toni Tamarit|RB, RWB, RM|27|21|Spain|€990K
Gabriel Carioca|CB||28|Brazil|
Julián Martínez|CB|3|22|Honduras|€720K
Yaya Bojang|CB, LB|4|22|Gambia|€1.5M
Steven Baseya|CB|14|21|France|€910K
Ikker Julian|CB|15|21|Belgium|
Sergi Gómez|CB|21|34|Spain|€260K
Mofe Jemide|CB|24|20|England|
Bastien Meupiyou|CB|33|20|France|€9.7M
Óscar Torrellas|CB|77|19|Spain|
Ian Luccas|DM, CM, ST, AM|25|23|Brazil|€1.1M
Rayan Lucas|DM, CM|35|21|Brazil|€1.2M
Lucca Giuntini|Midfielder||21|Brazil|
Tiago Octavio|Midfielder||22|Portugal|
Sabit Abdulai|CM|5|27|Ghana|€530K
Davy Gui|CM, DM|6|20|Ivory Coast|€1.1M
Vasco Moreira|CM, RW|8|25|Portugal|
Zé Rafael|CM|93|33|Brazil|€350K
Nabili Touaizi|RM, RWB|2|25|Spain|€940K
Diogo Spencer|RM, RWB, LM|20|22|Portugal|€1.8M
Isaac James|LM, CB, LWB, LB|12|22|Nigeria|€920K
Zakaria Kassary|LM|18|20|Morocco|
Francisco Chissumba|LM, LWB|55|21|Portugal|€5.8M
Lucas Figueiredo|RW, LW, AM|22|25|Brazil|€4.4M
Matheus França|RW|26|22|Brazil|€6.8M
Rodrigo Pereira|Attacker||22|Portugal|
André Vidigal|LW|7|28|Angola|€720K
Chiquinho|LW, AM, RW|10|26|Portugal|€3.9M
Cédric Nuozzi|LW|11|20|Belgium|€1.2M
Vivaldo Semedo|ST|9|21|Portugal|
Samy Jr. Merheg|ST, AM|17|19|Lebanon|€1.6M
Dawda Camara|ST|19|24|Mauritania|€1.8M
## estrela-amadora
David Grilo|GK|22|30|Portugal|€380K
Léo Linck|GK|24|25|Brazil|€1.9M
Diogo Pinto|GK|51|22|Portugal|€500K
Jefferson Encada|RB, RM|17|28|Guinea-Bissau|€440K
Max Scholze|RB|21|21|Germany|€2.2M
Bernardo Schappo|CB|4|27|Brazil|€510K
Stefan Leković|CB|5|22|Serbia|€2.1M
Luan Patrick|CB|30|24|Brazil|€1.7M
Atanas Chernev|CB|79|24|Bulgaria|€780K
Lucas Mincarelli Davin|LB|3|22|France|€1.1M
Rafa Soares|LB|55|31|Portugal|€900K
Kevin Höög Jansson|DM, CM|6|26|Sweden|€520K
Eddy Doué|DM, CM, AM|39|20|Ivory Coast|€6.2M
Emerson Pedro Vanga|DM|71|20|France|€380K
Santiago Serra|DM|78|19|Portugal|
Vuk Pavicevic|Midfielder||18|Montenegro|
Robinho|CM, DM|8|24|Brazil|€620K
Lovro Zvonarek|CM, AM|14|21|Croatia|€1.8M
Tom Moustier|CM, AM|28|24|France|€590K
Rodrigo Dudok|RM, LM, CM||19|Uruguay|€790K
Joan Jordán|AM|19|32|Spain|€610K
Abraham Marcus|RW|99|26|Nigeria|€1M
Si-Woo Yang|Attacker||20|South Korea|€580K
Ianis Stoica|LW, LM, AM|10|23|Romania|€3.7M
Henrique Poniewas|Attacker|72|20|Brazil|
Alisson Jesus|Attacker|80|21|Brazil|
Beni Souza|LW|93|23|France|
Jeremy Arévalo|ST||21|Ecuador|€9.3M
Leandro Antonetti|ST|37|23|Puerto Rico|€4M
René Mitongo|ST|49|18|Belgium|€1.6M
## nacional
Renato Marin|GK|1|20|Italy|€3.3M
João Gonçalves|GK|13|26|Portugal|€550K
Kevyn|GK|50|21|Brazil|
Ivanildo Fernandes|RB|14|30|Cape Verde|€200K
Deivison|RB|88|20|Brazil|€650K
Wesley|RB, RM, RWB|52|26|Brazil|€600K
Ulisses Rocha|CB|4|27|Brazil|€930K
Francisco Gonçalves|CB|33|22|Portugal|€580K
Léo Santos|CB|34|27|Brazil|€790K
Zé Vítor|CB|38|25|Brazil|€1.5M
Pedro Silva|Defender|55|18|Portugal|
José Gomes|LB|5|30|Portugal|€240K
Daniel de la Cruz|RWB|2|22|Ecuador|€750K
Josué|CM||21|Brazil|€940K
Matchoi|CM||23|Portugal|€600K
Matheus Dias|CM, DM, CB|6|24|Brazil|€1.5M
Miguel Baeza|CM, DM, RW, AM|8|26|Spain|€310K
Chiheb Labidi|CM, AM|15|25|Tunisia|€380K
Filipe Soares|CM, DM|22|27|Portugal|€290K
Joel da Silva|CM|26|23|Portugal|€620K
Liziero|CM, AM, DM|28|28|Brazil|€1.1M
Danel Dongmo|CM, DM|31|25|Cameroon|€560K
William Kokolo|LM, LB, LWB|21|26|France|€560K
Mateus Iseppe|AM|23|20|Brazil|
Stavros Gavriel|RW, AM|11|24|Cyprus|€640K
Markus Gustav Jensen|RW, LW, LM, RB|7|21|Denmark|€880K
Daniel|RW, LW, CM|10|24|Brazil|€680K
Martim Watts|LW|30|21|Portugal|
Min-Kyu Song|LW, LM|12|27|South Korea|€960K
Fernando Nava|LW, LM, RW|17|22|Bolivia|€610K
Allen Obando|ST|9|20|Ecuador|€1.1M
Njoya Kader|ST|29|23|Cameroon|€980K
Pablo Ruan|ST, RW|99|23|Brazil|€660K
## vitoria-guimaraes
Juan Diego Castillo|GK|22|23|Colombia|€920K
Oliwier Zych|GK|48|22|Poland|€1.6M
Maga|RB|2|24|Portugal|€1.2M
Tony Strata|RB|23|22|Romania|€4.4M
Óscar Rivas|CB|4|26|Spain|€960K
Ahmed Sidibé|CB|5|24|France|€610K
Yeimar Mosquera|CB|15|21|Colombia|€510K
Toni Borevković|CB|21|29|Croatia|€1.9M
João Mendes|LB|13|26|Portugal|€1.7M
Mohammed Kebdani|LB|40|20|Morocco|
Francisco Dias|LB, CB|82|24|Portugal|
Marco Cruz|DM, CM||22|Portugal|€440K
Matija Mitrović|DM|6|21|Serbia|€1.9M
Gonçalo Nogueira|DM|8|22|Portugal|€5.5M
Beni|DM, CM, AM|16|24|Angola|€3.8M
Lohann Doucet|DM|44|24|Burkina Faso|€1.1M
Alan|CM, AM, ST|10|26|Brazil|€3.9M
Samu|AM|20|30|Portugal|€1.3M
Telmo Arcanjo|RW, AM, RM|18|25|Cape Verde|€1.9M
Ricardo Rocha|RW, DM|80|23|Portugal|
Gustavo Silva|RW, ST, LW|11|27|Brazil|€2.3M
Miguel Nogueira|RW|17|21|Portugal|€2.1M
Oumar Camara|LW, RW, ST|7|19|France|€11M
Victor Andersson|LW|19|22|Sweden|€1.1M
Arnel Jakupović|ST|9|28|Austria|€770K
Alioune Ndoye|ST|24|25|Senegal|€1M
Patrick Ouotro|ST|29|21|Ivory Coast|€360K
## maritimo
Goncalo Tabuaco|GK|1|25|Portugal|€330K
Alfonso Pastor|GK|13|26|Spain|€370K
Francisco Vieites|GK|30|27|Spain|€860K
Kimiss Zavala|GK|34|22|Mozambique|
Igor Julião|RB|2|32|Brazil|€300K
Tyler Keating|CB||21|United States|€230K
Rafael Fernandes|CB|4|24|Portugal|€590K
Gábor Szalai|CB|22|26|Hungary|€920K
Romain Correia|CB|44|27|Portugal|€790K
Nathanael Ogbeta|LB|3|25|England|€480K
Nilton Varela|LB|5|25|Portugal|€720K
Paulo Henrique|LB|23|30|Portugal|
Raphael Guzzo|DM, CM, LM, AM|14|31|Portugal|€250K
Vladan Danilović|DM, CM, ST|18|27|Bosnia-Herzegovina|€370K
Israel Isaac Ayuma|DM|66|21|Nigeria|€630K
Rodrigo Andrade|CM, DM, RB|6|25|Portugal|€370K
Tomás Tavares|CM, RW|15|25|Portugal|€560K
Francisco Silva|Midfielder|16|19|Portugal|
Ibrahim Alani|CM|21|20|Nigeria|€910K
Yellu Santiago|CM|25|22|Spain|€980K
Nelio Batista|Midfielder|68|17|Portugal|
Mons Bassouamina|LM|12|28|Congo|€300K
Maxime Dominguez|AM|8|30|Switzerland|€260K
Simo Bouzaidi|RW, LW, RM|11|27|Morocco|€920K
Bryan Limbombe|RW, RM|35|25|Belgium|€540K
Enrique Peña Zauner|LW|7|26|Venezuela|€310K
Martín Tejón|LW, RW, CM|10|22|Spain|€1.7M
Francisco Gomes|LW, RW|20|22|Portugal|
Jose Melro|ST|9|22|Portugal|
Adrián Butzke|ST|17|27|Spain|€520K
Samuel Bamba|ST|27|22|Germany|€560K
Maurice Boakye|ST|90|22|Germany|€530K
## casa-pia
Patrick Sequeira|GK|1|27|Costa Rica|€1.6M
Daniel Azevedo|GK|22|28|Portugal|€290K
André Gomes|GK|31|22|Portugal|€3.3M
Ivan Mandić|GK|95|23|Croatia|€320K
Khaly|CB|3|22|Angola|€510K
João Goulart|CB|4|26|Portugal|€850K
André Geraldes|CB, RB|18|35|Portugal|€270K
Kaique Rocha|CB|27|25|Brazil|€1M
David Sousa|CB|43|25|Brazil|€1M
Felipe Silva|CB|44|24|Brazil|€1M
Pedro Silva Rosas|LB, LM|75|25|Portugal|€600K
João Pedro|DM, AM|98|21|Brazil|€1.7M
Gabi Pereira|CM, LM|8|26|Portugal|€590K
Selvi Clua|CM, DM|16|21|Spain|€850K
Seba Pérez|CM, DM|24|33|Colombia|€270K
Abdu Dafe|CM|59|18|Guinea-Bissau|
Lawrence Ofori|CM, DM|80|28|Ghana|€790K
Evans Maurin|RM|17|25|France|€560K
Abdu Conté|LM, LB|5|28|Portugal|€530K
João Rego|AM, LW, RW, CM|70|21|Portugal|
Mohamed El Boukammiri|RW, RM|11|22|Belgium|€1.1M
Kevin Prieto|RW, RM|19|23|Uruguay|€630K
Jérémy Livolant|RW, LW, ST|29|28|France|€1.3M
Rochinha|LW|10|31|Portugal|€280K
Aymen Zouin|LW|21|19|Italy|€660K
Benjamin Pauwels|LW|77|22|Belgium|€700K
Henrique Araújo|ST|9|24|Portugal|€1.2M
Alassana Jatta|ST|20|27|Gambia|€600K
Cassiano|ST|90|37|Brazil|€500K
## rio-ave
Antzelo Sina|GK||22|Albania|
Cezary Miszta|GK|1|25|Poland|€2.3M
Kevin Chamorro|GK|22|26|Costa Rica|€510K
Vítor Hugo|GK|32|25|Brazil|€800K
Rodrigo Real|GK|98|18|Portugal|
Ennio van der Gouw|GK|99|26|Netherlands|€580K
Zé Carlos|RB|2|28|Portugal|€1.2M
Marios Vrousai|RB, RM, LB, LM|17|28|Greece|€1.6M
João Tomé|RB, RM|20|23|Portugal|€380K
Cressi|Defender||22|Brazil|
Simón García|CB|3|21|Colombia|
Julien Lomboto|CB|13|24|France|€520K
Jakub Brabec|CB|14|34|Czech Republic|€260K
Francisco Petrasso|CB|23|24|Argentina|€1.3M
Gustavo Mancha|CB|39|22|Brazil|€1.5M
Caike|Defender|60|21|Brazil|
Nelson Abbey|LB, CB|6|23|England|€1.5M
Pedro Amaral|LB, LM, CB, RM|24|29|Portugal|€1.1M
Andreas-Richardos Ntoi|DM, CM, CB, RB|5|23|Greece|€5.2M
Ryan Guilherme|DM|8|23|Brazil|
Tamás Nikitscher|DM, CM|44|27|Hungary|€740K
Giorgos Liavas|DM, RB, CM|54|25|Greece|€640K
Diogo Nascimento|DM, CM, AM|90|24|Portugal|€3.9M
Brandon Aguilera|CM|10|23|Costa Rica|€1.2M
Antoine Wenck|Midfielder|70|20|Senegal|
Malik Sellouki|RM, AM, ST, LM|19|26|France|€850K
Dijar Ferati|LM|75|18|Albania|€520K
Miguel Patricio|AM|79|19|Portugal|
Tobías Medina|AM|27|22|Argentina|€620K
Diogo Bezerra|RW, LW|7|24|Brazil|€1.5M
Roland Galcík|RW|30|25|Slovakia|€640K
Sebastian Clemmensen|RW, ST|80|23|Denmark|€1.1M
Samuel Alves|Attacker|67|18|Brazil|
Dario Špikić|LW, RW|77|27|Croatia|€880K
Tamble Monteiro|ST|9|26|Guinea-Bissau|€1M
Jalen Blesa|ST, AM, LW|11|25|Spain|€1.8M
Radek Šiler|ST|21|22|Czech Republic|€1.3M
## estoril
Joel Robles|GK|1|36|Spain|€430K
Martin Turk|GK|16|23|Slovenia|€620K
Diogo Dias|GK|23|23|Portugal|
Fletcher Lowe|GK|43|19|South Africa|
Ricard Sánchez|RB, RM, LM|2|26|Spain|€1.7M
Ferro|CB|4|29|Portugal|€590K
Antef Tsoungui|CB, DM, CM|5|23|England|€1.1M
Xavi Sintes|CB|6|25|Spain|€350K
Ismael Sierra|CB|15|23|Spain|€750K
Stélios Andreou|CB, RB|25|24|Cyprus|€1.7M
Samuel Amissah|CB|35|19|England|
Kazim|Defender|41|21|Brazil|
Longin Bimai|Defender|57|20|France|
Fernando Medrano|LB, LWB, LM|3|26|Spain|€560K
Tiago Parente|LB, LM|19|22|Portugal|€660K
Roko Jurišić|LB, CB, LWB|21|25|Croatia|€660K
Jordan Arnolin|CM|42|18|Portugal|
Xeka|CM, DM|8|32|Portugal|€490K
Jordan Holsgrove|CM, DM|10|27|Scotland|€3.8M
Milan Robin|CM, DM|44|27|France|€920K
Luís Gomes|CM|80|22|Portugal|
Tiago Brito|CM, DM|90|22|Portugal|€570K
Pedro Carvalho|RM, RB|22|23|Portugal|€820K
João Carvalho|AM, LM, CM, RW, LW|12|29|Portugal|€2M
Isra Salazar|RW||23|Spain|€540K
Rafik Guitane|RW, RM|99|27|France|€1.9M
André Lacximicant|LW, ST, RW|7|25|Portugal|€900K
Nail Omerović|LW, AM, RW|11|24|Bosnia-Herzegovina|€1.8M
Peixinho|LW|17|22|Portugal|
Fabrício Garcia|LW|98|25|Cape Verde|€540K
Axel Camblan|ST, RW|9|23|France|€830K
Yanis Begraoui|ST, LW, RW|14|25|Morocco|€13M
`;
